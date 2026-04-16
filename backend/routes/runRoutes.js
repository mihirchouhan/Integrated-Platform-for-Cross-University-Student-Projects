const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();

const TEMP_DIR = path.join(__dirname, '../temp_code');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

const executeCode = (command, filePath) => {
  return new Promise((resolve) => {
    exec(command, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      // Cleanup
      fs.unlink(filePath, () => {});
      
      if (error) {
        if (error.killed) return resolve({ error: "Execution timed out (5s limit)." });
        return resolve({ error: stderr || stdout || error.message });
      }
      resolve({ output: stdout || stderr || "Program executed successfully but returned no output." });
    });
  });
};

router.post('/', async (req, res) => {
  const { language, code } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  const id = crypto.randomBytes(8).toString('hex');
  let filePath, command;

  try {
    if (language === 'javascript') {
      filePath = path.join(TEMP_DIR, `${id}.js`);
      fs.writeFileSync(filePath, code);
      command = `node "${filePath}"`;
      
      const result = await executeCode(command, filePath);
      return res.json(result);
    } else if (language === 'python') {
      filePath = path.join(TEMP_DIR, `${id}.py`);
      fs.writeFileSync(filePath, code);
      // use python or python3 based on environment, python usually works on windows
      command = `python "${filePath}"`;
      
      const result = await executeCode(command, filePath);
      return res.json(result);
    } else {
      // Return a simulated output for other languages for demonstration
      return res.json({ 
        output: `[System]: Remote execution for '${language}' is currently not fully configured on this server.\n\n[Simulated Output]:\nCompiled successfully.\nOutput: Hello, World!` 
      });
    }
  } catch (err) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(500).json({ error: "Server error during execution: " + err.message });
  }
});

module.exports = router;
