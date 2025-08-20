const ContactPage = () => (
  <div className="max-w-xl mx-auto py-16 px-4 text-center">
    <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
    <p className="text-gray-600 mb-8">Have questions or need support? Reach out to our team and we'll get back to you soon.</p>
    <form className="space-y-4">
      <input type="text" placeholder="Your Name" className="w-full border rounded px-4 py-2" />
      <input type="email" placeholder="Your Email" className="w-full border rounded px-4 py-2" />
      <textarea placeholder="Your Message" className="w-full border rounded px-4 py-2" rows={4}></textarea>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition">Send Message</button>
    </form>
  </div>
);

export default ContactPage;
