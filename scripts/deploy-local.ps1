#Requires -Version 5.1
<#
.SYNOPSIS
  Build all 5 LogBook images and deploy them to Docker Desktop's built-in
  Kubernetes, entirely free and entirely local.

.DESCRIPTION
  1. Confirms the "docker-desktop" kubectl context is selected and reachable
     (Settings > Kubernetes > Enable Kubernetes in Docker Desktop if not).
  2. Builds all 5 service images tagged :local directly into Docker
     Desktop's image store (no registry needed).
  3. Creates the logbook namespace + logbook-secrets Secret from .env
     (copy .env.example to .env and fill it in first).
  4. Installs ingress-nginx via Helm if it isn't already present.
  5. Applies k8s-local (the Kustomize overlay that points every
     deployment at the :local images - see k8s-local/kustomization.yaml).
  6. Waits for every deployment to roll out, then does a quick timed
     request against the app so you can see it's actually up and how
     fast it's responding.

.NOTES
  Run from the repo root: .\scripts\deploy-local.ps1
#>

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "    $msg" -ForegroundColor Yellow }

# ---------------------------------------------------------------------
Step "Checking Docker Desktop's Kubernetes is enabled and selected"
$ctx = kubectl config current-context 2>$null
if ($ctx -ne "docker-desktop") {
  Write-Host "Current kubectl context is '$ctx', not 'docker-desktop'." -ForegroundColor Red
  Write-Host "Run: kubectl config use-context docker-desktop" -ForegroundColor Red
  Write-Host "(If that context doesn't exist: Docker Desktop > Settings > Kubernetes > Enable Kubernetes, then Apply & Restart.)"
  exit 1
}
try {
  kubectl cluster-info --request-timeout=5s | Out-Null
} catch {
  Write-Host "Can't reach the docker-desktop cluster." -ForegroundColor Red
  Write-Host "Open Docker Desktop, check Settings > Kubernetes > Enable Kubernetes is checked, and wait for the green 'Running' status in the bottom-left before retrying."
  exit 1
}
Ok "docker-desktop cluster is reachable"

# ---------------------------------------------------------------------
Step "Building images (tag :local) directly into Docker Desktop's image store"
$services = @(
  @{ Name = "auth-service";        Path = "services/auth-service" },
  @{ Name = "customer-service";    Path = "services/customer-service" },
  @{ Name = "inventory-service";   Path = "services/inventory-service" },
  @{ Name = "transaction-service"; Path = "services/transaction-service" },
  @{ Name = "insights-service";    Path = "services/insights-service" },
  @{ Name = "frontend-service";    Path = "frontend" }
)
foreach ($svc in $services) {
  Write-Host "    building $($svc.Name)..."
  docker build -t "vaishnavisaw01/$($svc.Name):local" $svc.Path
  if ($LASTEXITCODE -ne 0) { throw "docker build failed for $($svc.Name)" }
}
Ok "all 5 images built"

# ---------------------------------------------------------------------
Step "Creating namespace + logbook-secrets Secret"
kubectl create namespace logbook --dry-run=client -o yaml | kubectl apply -f -

if (-not (Test-Path ".env")) {
  Write-Host "No .env file found." -ForegroundColor Red
  Write-Host "Copy .env.example to .env and fill in MONGO_URI and JWT_SECRET, then re-run this script."
  exit 1
}
# --from-env-file reads KEY=VALUE lines directly, same file docker compose uses
kubectl create secret generic logbook-secrets `
  --namespace logbook `
  --from-env-file=.env `
  --dry-run=client -o yaml | kubectl apply -f -
Ok "logbook-secrets is up to date"

# ---------------------------------------------------------------------
Step "Installing/upgrading ingress-nginx (skips if already up to date)"
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx 2>$null | Out-Null
helm repo update ingress-nginx 2>$null | Out-Null
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx `
  --namespace ingress-nginx --create-namespace `
  --set controller.service.type=LoadBalancer
Ok "ingress-nginx ready"

# ---------------------------------------------------------------------
Step "Applying application manifests (k8s-local overlay)"
kubectl apply -k k8s-local
if ($LASTEXITCODE -ne 0) { throw "kubectl apply -k k8s-local failed" }

Step "Waiting for rollouts"
$deployments = @("auth-service", "customer-service", "inventory-service", "transaction-service", "insights-service", "frontend-service")
foreach ($d in $deployments) {
  kubectl rollout status "deployment/$d" -n logbook --timeout=120s
  if ($LASTEXITCODE -ne 0) {
    Warn "$d did not become ready in time - check: kubectl logs -n logbook deployment/$d"
  } else {
    Ok "$d is ready"
  }
}

Step "Waiting for the ingress-nginx controller to get an external address on localhost"
$deadline = (Get-Date).AddSeconds(90)
$ready = $false
while ((Get-Date) -lt $deadline) {
  $svc = kubectl get svc -n ingress-nginx ingress-nginx-controller -o json 2>$null | ConvertFrom-Json
  if ($svc.status.loadBalancer.ingress) { $ready = $true; break }
  Start-Sleep -Seconds 3
}
if (-not $ready) {
  Warn "ingress-nginx controller has no external address yet - Docker Desktop usually assigns 'localhost' within a few seconds. Check: kubectl get svc -n ingress-nginx"
}

# ---------------------------------------------------------------------
Step "Smoke-testing the app through the ingress (http://localhost)"
$endpoints = @("/", "/api/auth", "/api/parties", "/api/inventory", "/api/transactions", "/api/insights")
foreach ($ep in $endpoints) {
  try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $resp = Invoke-WebRequest -Uri "http://localhost$ep" -UseBasicParsing -TimeoutSec 5
    $sw.Stop()
    Ok "$ep -> HTTP $($resp.StatusCode) in $($sw.ElapsedMilliseconds) ms"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code) {
      Ok "$ep -> HTTP $code (expected for an unauthenticated API root)"
    } else {
      Warn "$ep -> unreachable: $($_.Exception.Message)"
    }
  }
}

Write-Host "`nDone. Open http://localhost in your browser." -ForegroundColor Cyan
Write-Host "Useful commands:"
Write-Host "  kubectl get pods -n logbook"
Write-Host "  kubectl logs -n logbook deployment/<name> -f"
Write-Host "  kubectl delete -k k8s-local   # tear down the app (leaves ingress-nginx + the secret)"
