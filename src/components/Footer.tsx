import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="section-padding py-24 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24">
          {/* Brand Column */}
          <div className="space-y-6">
            <h3 className="font-serif text-lg">Studio Assembly</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Est. 2025.<br />
              Based in Canada.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="space-y-6">
            <h4 className="mono text-muted-foreground">Navigate</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/process" className="text-sm hover:opacity-70 transition-opacity">
                Process
              </Link>
              <Link to="/city" className="text-sm hover:opacity-70 transition-opacity">
                The City
              </Link>
              <Link to="/store" className="text-sm hover:opacity-70 transition-opacity">
                Store
              </Link>
              <Link to="/contact" className="text-sm hover:opacity-70 transition-opacity">
                Contact
              </Link>
            </nav>
          </div>

          {/* Legal Column */}
          <div className="space-y-6">
            <h4 className="mono text-muted-foreground">Legal</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              An independent design studio.<br />
              Not affiliated with the LEGO® Group.
            </p>
          </div>
        </div>

        <div className="divider mt-16 mb-8" />

        <p className="mono text-muted-foreground text-center">
          © 2025 Studio Assembly. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;