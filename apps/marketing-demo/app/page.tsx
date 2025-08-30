export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-4">Better Marketing Demo</h1>
        <p className="text-lg text-gray-600">
          This is a demo application showcasing the features of Better
          Marketing.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">User Management</h3>
            <p className="text-sm text-gray-600">
              Create and manage marketing users with custom properties
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Event Tracking</h3>
            <p className="text-sm text-gray-600">
              Track user events and behaviors
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Campaign Management</h3>
            <p className="text-sm text-gray-600">
              Create and send marketing campaigns
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Segmentation</h3>
            <p className="text-sm text-gray-600">
              Create user segments based on properties and behaviors
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Email & SMS</h3>
            <p className="text-sm text-gray-600">
              Send transactional and marketing messages
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Analytics Integration</h3>
            <p className="text-sm text-gray-600">
              Connect with multiple analytics providers
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-x-4">
          <a
            href="/api/marketing/docs"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            API Documentation
          </a>
          <a
            href="/dashboard"
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Dashboard
          </a>
        </div>
      </section>
    </div>
  );
}
