import React from "react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-outline-variant/20 mt-16">
      <div className="max-w-container-max mx-auto px-margin-desktop py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo */}
          <div>
            <div className="text-[42px] font-extrabold text-primary mb-4">
              NETBUS
            </div>

            <p className="text-body-md text-on-surface-variant leading-8">
              Revolutionizing infrastructure for a zero-emission future.
            </p>
          </div>

          {/* Company */}
          <div>
            <h5 className="font-bold text-xl mb-6 text-on-surface">
              Company
            </h5>

            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="underline underline-offset-4 text-on-surface-variant hover:text-primary transition-colors"
                >
                  Careers
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="underline underline-offset-4 text-on-surface-variant hover:text-primary transition-colors"
                >
                  Fleet Technology
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="underline underline-offset-4 text-on-surface-variant hover:text-primary transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5 className="font-bold text-xl mb-6 text-on-surface">
              Legal
            </h5>

            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="underline underline-offset-4 text-on-surface-variant hover:text-primary transition-colors"
                >
                  Terms of Service
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="underline underline-offset-4 text-on-surface-variant hover:text-primary transition-colors"
                >
                  Privacy Policy
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="underline underline-offset-4 text-on-surface-variant hover:text-primary transition-colors"
                >
                  Carbon Offset Program
                </a>
              </li>
            </ul>
          </div>

          {/* Eco Cert */}
          <div>
            <h5 className="font-bold text-xl mb-6 text-on-surface">
              Eco-Cert
            </h5>

            <div className="border border-primary/20 rounded-xl px-4 py-4 flex items-center gap-3 bg-primary/5">
              <span className="text-green-700 text-xl">🌿</span>

              <span className="font-mono text-primary text-sm">
                Carbon Neutral Certified 2024
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant/10 py-8">
        <div className="max-w-container-max mx-auto px-margin-desktop text-center">
          <p className="font-mono text-sm text-on-surface-variant">
            © 2024 NETBUS Infrastructure. All rights reserved. Driving a greener
            future.
          </p>
        </div>
      </div>
    </footer>
  );
}