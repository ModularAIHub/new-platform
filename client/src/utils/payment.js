const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let razorpayScriptPromise = null;

const loadRazorpayScript = () => {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (window.Razorpay) return Promise.resolve(true);

    if (razorpayScriptPromise) return razorpayScriptPromise;

    razorpayScriptPromise = new Promise((resolve) => {
        const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);

        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
            existingScript.addEventListener('error', () => resolve(false), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = RAZORPAY_SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve(Boolean(window.Razorpay));
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    }).finally(() => {
        if (!window.Razorpay) {
            razorpayScriptPromise = null;
        }
    });

    return razorpayScriptPromise;
};

export { loadRazorpayScript };
