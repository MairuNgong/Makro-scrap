chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const rows = Array.from(document.querySelectorAll('.MuiBox-root.css-1yrviot'));
      alert("Go see query in extension console in chrome://extensions/");
      return rows.map(row => {
        const main = row.querySelector('.MuiTypography-root.MuiTypography-body1.main.css-1h5mriw')?.innerText || "";
        const sub = row.querySelector('.MuiTypography-root.MuiTypography-body1.sub.css-1h5mriw')?.innerText || "";
        const price = row.querySelector('.MuiTypography-root.MuiTypography-body1.css-1241l0o')?.innerText || "";
        const qty = row.querySelector('.MuiTypography-root.MuiTypography-body1.quantity.css-1h5mriw')?.innerText || "";
        return [main, sub, price, qty];
      });
      
    }
  }).then(result => {
    const transactions = result[0].result;

    const values = transactions.map(([main, sub, price, qty]) => {
      const name = main.replace(/\s+x\s+\d+$/, '') // remove x and quantity from main
      const quantity_per_pack = parseInt(sub.match(/\d+/));
      const cost_per_pack = parseFloat(price.replace(/[^\d.]/g, '')) || 0;
      const quantity = parseInt(qty);
      return `('${name}', ${quantity_per_pack}, ${cost_per_pack}, ${quantity})`;
    });

    const sql = `
    WITH new_values(name, quantity_per_pack, cost_per_pack, quantity) AS (
      VALUES
        ${values.join(',\n  ')}
    )
    UPDATE items
    SET
      quantity_per_pack = new_values.quantity_per_pack,
      cost_per_pack = new_values.cost_per_pack,
      quantity += new_values.quantity
    FROM new_values
    WHERE items.name = new_values.name;
    `;

    console.log("📦 Generated SQL Query:\n", sql);
  });
});
