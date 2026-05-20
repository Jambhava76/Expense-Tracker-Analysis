document.addEventListener("DOMContentLoaded", function () {

  // ===============================
  // DOM ELEMENTS
  // ===============================
  const balance = document.getElementById("balance");
  const moneyPlus = document.getElementById("money-plus");
  const moneyMinus = document.getElementById("money-minus");
  const list = document.getElementById("list");
  const form = document.getElementById("form");
  const text = document.getElementById("text");
  const amount = document.getElementById("amount");
  const categorySelect = document.getElementById("category");
  const accountSelect = document.getElementById("account");

  const exportCSVBtn = document.getElementById("exportCSV");
  const exportPDFBtn = document.getElementById("exportPDF");

  let monthlyChart = null;
  let categoryChart = null;

  // ===============================
  // LOCAL STORAGE
  // ===============================
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }

  // ===============================
  // ADD TRANSACTION
  // ===============================
  function addTransaction(e) {
    e.preventDefault();

    if (!text.value.trim() || !amount.value.trim()) {
      alert("Please enter description and amount");
      return;
    }

    const transaction = {
      id: Date.now(),
      text: text.value,
      amount: +amount.value,
      category: categorySelect ? categorySelect.value : "Other",
      account: accountSelect ? accountSelect.value : "Cash",
      date: new Date().toISOString()
    };

    transactions.push(transaction);
    saveData();
    Init();

    text.value = "";
    amount.value = "";
  }

  // ===============================
  // REMOVE TRANSACTION
  // ===============================
  window.removeTransaction = function (id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    Init();
  };

  // ===============================
  // RENDER TRANSACTION
  // ===============================
  function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? "-" : "+";

    const li = document.createElement("li");
    li.classList.add(transaction.amount < 0 ? "minus" : "plus");

    li.innerHTML = `
      <div>
        <strong>${transaction.text}</strong><br>
        <small>${transaction.category} | ${transaction.account}</small><br>
        <small>${new Date(transaction.date).toLocaleDateString()}</small>
      </div>
      <div>
        <span>${sign}₹${Math.abs(transaction.amount)}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
      </div>
    `;

    list.appendChild(li);
  }

  // ===============================
  // UPDATE BALANCE
  // ===============================
  function updateValues() {
    const amounts = transactions.map(t => t.amount);

    const total = amounts.reduce((a, b) => a + b, 0);
    const income = amounts.filter(a => a > 0).reduce((a, b) => a + b, 0);
    const expense = amounts.filter(a => a < 0).reduce((a, b) => a + b, 0);

    balance.innerHTML = `₹${total.toFixed(2)}`;
    moneyPlus.innerHTML = `+₹${income.toFixed(2)}`;
    moneyMinus.innerHTML = `-₹${Math.abs(expense).toFixed(2)}`;
  }

  // ===============================
  // MONTHLY CHART
  // ===============================
  function renderMonthlyChart() {
    const canvas = document.getElementById("monthlyChart");
    if (!canvas) return;

    if (monthlyChart) monthlyChart.destroy();

    const monthlyData = {};

    transactions.forEach(t => {
      const month = new Date(t.date).toLocaleString("default", { month: "short" });
      if (!monthlyData[month]) monthlyData[month] = 0;
      monthlyData[month] += t.amount;
    });

    monthlyChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: Object.keys(monthlyData),
        datasets: [{
          label: "Net Amount",
          data: Object.values(monthlyData),
          backgroundColor: "#2563eb"
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 1000 }
      }
    });
  }

  // ===============================
  // CATEGORY CHART
  // ===============================
  function renderCategoryChart() {
    const canvas = document.getElementById("categoryChart");
    if (!canvas) return;

    if (categoryChart) categoryChart.destroy();

    const categoryData = {};

    transactions.forEach(t => {
      if (!categoryData[t.category]) categoryData[t.category] = 0;
      categoryData[t.category] += Math.abs(t.amount);
    });

    categoryChart = new Chart(canvas, {
      type: "pie",
      data: {
        labels: Object.keys(categoryData),
        datasets: [{
          data: Object.values(categoryData),
          backgroundColor: [
            "#2563eb",
            "#16a34a",
            "#dc2626",
            "#f59e0b",
            "#7c3aed"
          ]
        }]
      }
    });
  }

  // ===============================
  // CSV EXPORT
  // ===============================
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener("click", function () {

      if (transactions.length === 0) {
        alert("No transactions available.");
        return;
      }

      const headers = ["Description", "Amount", "Category", "Account", "Date"];
      const rows = transactions.map(t => [
        t.text,
        t.amount,
        t.category,
        t.account,
        new Date(t.date).toLocaleDateString()
      ]);

      const csvContent =
        [headers, ...rows]
          .map(row => row.join(","))
          .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "Finance_Report.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    });
  }

  // ===============================
  // PDF EXPORT
  // ===============================
  if (exportPDFBtn) {
    exportPDFBtn.addEventListener("click", function () {

      if (transactions.length === 0) {
        alert("No transactions available.");
        return;
      }

      if (!window.jspdf) {
        alert("jsPDF not loaded properly.");
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Finance Dashboard Report", 20, 20);

      let y = 30;

      transactions.forEach(t => {
        doc.setFontSize(10);
        doc.text(
          `${t.text} | ₹${t.amount} | ${t.category} | ${t.account} | ${new Date(t.date).toLocaleDateString()}`,
          20,
          y
        );
        y += 8;
      });

      doc.save("Finance_Report.pdf");
    });
  }

  // ===============================
  // INIT
  // ===============================
  function Init() {
    list.innerHTML = "";
    transactions.forEach(addTransactionDOM);
    updateValues();
    renderMonthlyChart();
    renderCategoryChart();
  }

  Init();
  if (form) form.addEventListener("submit", addTransaction);

});