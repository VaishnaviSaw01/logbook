import "./settings.css";

function HelpSupport() {
  return (
    <div className="settings-card">

      <h2>Help & Support</h2>
      {/* About App */}
      <div className="help-section">

        <h3>About LogBook</h3>
        <p>
          LogBook is a business ledger management system designed to manage
          customers, suppliers, transactions, and financial records efficiently.
        </p>
      </div>

      {/* How To Use */}
      <div className="help-section">
        <h3>How To Use</h3>
        <ul>
          <li>Add Customers and Suppliers from respective sections.</li>
          <li>Record Purchases and Payments properly.</li>
          <li>Use Transactions page to track money flow.</li>
          <li>Download backups regularly from Settings.</li>
        </ul>
      </div>

      {/* Data Safety */}
      <div className="help-section">
        <h3>Data Safety Tips</h3>
        <ul>
          <li>Take backup regularly.</li>
          <li>Do not share login credentials.</li>
          <li>Logout after use on shared devices.</li>
        </ul>
      </div>

      {/* Contact */}
      <div className="help-section">
        <h3>Contact Support</h3>
        <p>Email: <strong>logbookcontactus@gmail.com</strong></p>
        <p>Phone: <strong>+91 95087 08092</strong></p>
      </div>

      {/* Version Info */}
      <div className="help-section version">
        <p>Version: 1.0.0</p>
        <p>Developed using MERN Stack</p>
      </div>

    </div>
  );
}

export default HelpSupport;
