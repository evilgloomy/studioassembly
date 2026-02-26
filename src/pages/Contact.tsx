import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, MapPin } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Contact Info */}
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-bold tracking-widest uppercase">
                  CONTACT
                </h1>
                <p className="text-muted-foreground leading-relaxed max-w-md">
                  Have questions about our kits, custom projects, or wholesale inquiries? 
                  We'd love to hear from you.
                </p>

                <div className="space-y-6 pt-8">
                  <div className="flex items-start gap-4">
                    <Mail size={20} strokeWidth={1.5} className="mt-1" />
                    <div>
                      <h3 className="font-semibold tracking-wider uppercase text-sm mb-1">
                        EMAIL
                      </h3>
                      <a 
                        href="mailto:hello@studioassembly.com" 
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        hello@studioassembly.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin size={20} strokeWidth={1.5} className="mt-1" />
                    <div>
                      <h3 className="font-semibold tracking-wider uppercase text-sm mb-1">
                        LOCATION
                      </h3>
                      <p className="text-muted-foreground">
                        Toronto, Canada
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="border border-primary p-8 lg:p-12">
                <h2 className="text-lg font-semibold tracking-widest uppercase mb-8">
                  SEND A MESSAGE
                </h2>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium tracking-wider uppercase mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium tracking-wider uppercase mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium tracking-wider uppercase mb-2">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      className="w-full border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                      placeholder="Your message..."
                    />
                  </div>
                  <button type="submit" className="btn-black w-full text-sm">
                    SEND MESSAGE
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;