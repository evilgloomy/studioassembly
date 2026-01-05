import { Link } from "react-router-dom";
import { Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-primary">
      <div className="section-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold tracking-widest uppercase mb-4">
              STUDIO ASSEMBLY
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Curated construction kits for the modern builder. We design experiences 
              for adult collectors who appreciate precision, scale, and architectural beauty.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-4">
              NAVIGATE
            </h4>
            <nav className="flex flex-col gap-3">
              <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Shop
              </Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/journal" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Journal
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-4">
              CONNECT
            </h4>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} strokeWidth={1.5} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-input">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Studio Assembly. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Not affiliated with the LEGO Group.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;