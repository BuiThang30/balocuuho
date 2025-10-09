const { addUser } = require("./db");

(async () => {
  try {
    const id = await addUser("admin", "thang3010");
    console.log("✅ User created with ID:", id);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
