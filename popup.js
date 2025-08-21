
const tabs = document.querySelectorAll('.tab');
const tabsContent = document.querySelectorAll('.tab-content');
const updateContent = document.getElementById('update-item');
const checkContent = document.getElementById('check-item');

tabs.forEach((tab,index) => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabsContent.forEach(tc => tc.classList.remove('active'));
    tab.classList.add('active');
    tabsContent[index].classList.add('active');
  });
});


chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => {
      const rows = Array.from(document.querySelectorAll('.MuiBox-root.css-dvgoqj'));
      return rows.map(row => {
        const main = row.querySelector('.MuiTypography-root.MuiTypography-body1.main.css-1h5mriw')?.innerText || "";
        const sub = row.querySelector('.MuiTypography-root.MuiTypography-body1.sub.css-1h5mriw')?.innerText || "";
        const price = row.querySelector('.MuiTypography-root.MuiTypography-body1.css-hzy61z span, .MuiTypography-root.MuiTypography-body1.css-1241l0o')?.innerText || "";
        const qty = row.querySelector('.MuiTypography-root.MuiTypography-body1.quantity.css-1h5mriw')?.innerText || "";
        return [main, sub, price, qty];
      });
    }
  }).then(result => {
      const transactions = result[0].result || [];

      const Updatevalues = transactions.map(([main, sub, price, qty]) => {
        const name = main.replace(/(ก\.|มล\.|กรัม).*$/, '$1');
        const quantity_per_pack = parseInt(sub.match(/\d+/));
        const cost_per_pack = parseFloat(price.replace(/[^\d.]/g, ''));
        const quantity = parseInt(qty) * quantity_per_pack;
        return `('${name}', ${quantity_per_pack}, ${cost_per_pack}, ${quantity})`;
      });

      const Upadtesql = `
        WITH new_values(name, quantity_per_pack, cost_per_pack, quantity) AS (
          VALUES
            ${Updatevalues.join(',\n  ')}
        )
        UPDATE items
        SET
          quantity_per_pack = new_values.quantity_per_pack,
          cost_per_pack = new_values.cost_per_pack,
          quantity = items.quantity + new_values.quantity
        FROM new_values
        WHERE items.name = new_values.name;
          `;

        updateContent.querySelector("textarea").value = Upadtesql.trim();

        const Checkvalues = transactions.map(([main]) => {
          const name = main.replace(/(ก\.|มล\.|กรัม).*$/, '$1');
          return `('${name}')`;
        });

        const Checksql = `
          WITH new_values(name) AS (
            VALUES
              ${Checkvalues.join(',\n  ')}
          )
          SELECT n.name,
                CASE WHEN i.name IS NULL THEN '❌ NOT FOUND' ELSE '✅ FOUND' END AS status
          FROM new_values n
          LEFT JOIN items i
            ON i.name = n.name;
        `;

        checkContent.querySelector("textarea").value = Checksql.trim();
        
    });
});
