async function testRoutes() {
  console.log("Attempting to log in via HTTP...");
  
  // Format body as form data
  const body = new URLSearchParams();
  body.append("email", "newtechsisir@gmail.com");
  body.append("password", "password123");

  const loginRes = await fetch("http://localhost:5175/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    redirect: "manual", // Prevent automatic redirect follow to capture headers
  });

  console.log("Login status:", loginRes.status);
  const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
  console.log("Cookies received:", cookies);

  const cookieHeader = cookies.map(c => c.split(";")[0]).join("; ");

  // Test /circulation
  console.log("\nFetching /circulation...");
  const circRes = await fetch("http://localhost:5175/circulation", {
    headers: {
      "Cookie": cookieHeader,
    }
  });
  console.log("Circulation status:", circRes.status);
  const circText = await circRes.text();
  if (circRes.status >= 400 || circText.includes("error") || circText.includes("defined") || circText.includes("Unexpected")) {
    console.log("Circulation body preview:", circText.slice(0, 2000));
  } else {
    console.log("Circulation fetched successfully.");
  }

  // Test /admin
  console.log("\nFetching /admin...");
  const adminRes = await fetch("http://localhost:5175/admin", {
    headers: {
      "Cookie": cookieHeader,
    }
  });
  console.log("Admin status:", adminRes.status);
  const adminText = await adminRes.text();
  if (adminRes.status >= 400 || adminText.includes("error") || adminText.includes("defined") || adminText.includes("Unexpected")) {
    console.log("Admin body preview:", adminText.slice(0, 2000));
  } else {
    console.log("Admin fetched successfully.");
  }
}

testRoutes().catch(console.error);
