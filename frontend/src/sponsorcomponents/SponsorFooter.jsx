import { Icon } from "@iconify/react";
import './SponsorFooter.css';


export default function SponsorFooter() {
  return (
    <footer className="sponsor-footer">
      <div className="sponsor-footer-inner">
        <div className="sponsor-footer-grid">
          <div className="sponsor-footer-logo-col">
            <h1 className="sponsor-footer-logo">Logo</h1>
            <p className="small-body-text footer-desc">
              The easiest way to discover and book tickets for your favorite events.
              Secure, fast, and reliable.
            </p>
          </div>

          <div className="sponsor-footer-col">
            <h4>Discover</h4>
            <a href="#concerts">Concerts</a>
            <a href="#sports">Sports</a>
            <a href="#theater">Theater</a>
            <a href="#festival">Festival</a>
          </div>

          <div className="sponsor-footer-col">
            <h4>Support</h4>
            <a href="#help">Help Center</a>
            <a href="#contact">Contact Us</a>
            <a href="#refund">Refund Policy</a>
            <a href="#privacy">Privacy Policy</a>
          </div>

          <div className="sponsor-footer-col">
            <h4>Contact Us</h4>
            <p>
              717 South 12th St Suite 3<br />
              McAllen, TX, United States, Texas
            </p>
            <p>
              <a href="tel:+19564671080">+1 956-467-1080</a>
            </p>
            <p>
              <a href="mailto:info@eticketspro.com">info@eticketspro.com</a>
            </p>
          </div>
        </div>

        <div className="sponsor-footer-bottom">
          <p>© 2026 Deltoro Entertainment. All rights reserved.</p>

          <div className="sponsor-social-links">
            <a
              href="https://www.tiktok.com/@eticketspro"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
            >
              <Icon icon="simple-icons:tiktok" width="22" />
            </a>

            <a
              href="https://www.instagram.com/eticketspr0/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Icon icon="simple-icons:instagram" width="22" />
            </a>

            <a
              href="https://www.facebook.com/eticketspr0"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <Icon icon="simple-icons:facebook" width="22" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}