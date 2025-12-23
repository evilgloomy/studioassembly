import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="section-padding">
        <nav className="flex items-center justify-between py-6 border-b border-border">
          <Link to="/" className="font-serif text-xl tracking-tight">
            Studio Assembly
          </Link>
          
          <div className="hidden md:flex items-center gap-12">
            <Link to="/process" className="mono text-muted-foreground hover:text-foreground transition-colors">
              Process
            </Link>
            <Link to="/city" className="mono text-muted-foreground hover:text-foreground transition-colors">
              The City
            </Link>
            <Link to="/store" className="mono text-muted-foreground hover:text-foreground transition-colors">
              Store
            </Link>
            <Link to="/contact" className="mono text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>

          <button className="md:hidden mono text-muted-foreground">
            Menu
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;