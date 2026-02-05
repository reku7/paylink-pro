import React from "react";

const styles = {
  footer: {
    backgroundColor: "#f5f5f5",
    padding: "20px 0",
    textAlign: "center",
    marginTop: "auto",
  },
  footerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
  },
  footerLeft: {},
  footerLogoContainer: {
    display: "flex",
    alignItems: "center",
  },
  footerLogo: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#0070f3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "10px",
  },
  footerLogoText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: "18px",
  },
  footerLogoName: {
    fontWeight: "bold",
    fontSize: "18px",
  },
  footerTagline: {
    marginTop: "5px",
    fontSize: "14px",
    color: "#555",
  },
  footerRight: {
    fontSize: "14px",
    color: "#555",
  },
};

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        <div style={styles.footerLeft}>
          <div style={styles.footerLogoContainer}>
            <div style={styles.footerLogo}>
              <span style={styles.footerLogoText}>P</span>
            </div>
            <span style={styles.footerLogoName}>PayLinkPro</span>
          </div>
          <p style={styles.footerTagline}>
            Secure payments for Ethiopian merchants
          </p>
        </div>
        <div style={styles.footerRight}>
          © {new Date().getFullYear()} PayLinkPro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
