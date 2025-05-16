import { useEffect } from 'react';

const TawkMessenger = ({ name, email, phone, role }) => {
  useEffect(() => {
    const scriptId = 'tawk-to-widget';

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = "https://embed.tawk.to/6825b1d2470adc190e4bb59b/1ir9jt8ho";
      script.async = true;
      script.charset = "UTF-8";
      script.setAttribute("crossorigin", "*");
      script.id = scriptId;
      document.body.appendChild(script);
    }

    const checkTawkReady = setInterval(() => {
      if (window.Tawk_API?.setAttributes && window.Tawk_API?.addTags && window.Tawk_API?.sendMessage) {
        
        // ✅ Force logout to prevent session overlap
        if (window.Tawk_API.logout) {
          window.Tawk_API.logout();
        }

        // ✅ Now set unique identity
        window.Tawk_API.setAttributes({
          name: name || 'Guest',
          email: email || '',
        }, (error) => {
          if (error) console.error("Tawk.to identify error:", error);
        });

        // ✅ Tag with role and phone
        if (role) window.Tawk_API.addTags([role]);
        if (phone) window.Tawk_API.addTags([`Phone: ${phone}`]);

        // ✅ Role-specific greeting
        const greetingMap = {
          Farmer: "👋 Welcome Farmer! Let us know if you need help with harvest uploads, proposals, or inspections.",
          Middleman: "🤝 Welcome Middleman! Need assistance with deals, inventory, or mill requests?",
          Mill: "🏭 Hello Mill! Reach out if you have questions about processing requests or profile setup."
        };

        const message = greetingMap[role] || "👋 Welcome! Let us know how we can help.";
        window.Tawk_API.sendMessage(message);

        clearInterval(checkTawkReady);
      }
    }, 500);

    return () => clearInterval(checkTawkReady);
  }, [name, email, phone, role]);

  return null;
};

export default TawkMessenger;
