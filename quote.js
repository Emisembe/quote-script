const checkboxes = document.querySelectorAll('.service');
const totalDisplay = document.getElementById('total');
const subtotalDisplay = document.getElementById('subtotal');
const vatDisplay = document.getElementById('vat');
const vatInput = document.getElementById('vat-rate');
const vatLabel = document.getElementById('vat-label');
const summaryTable = document.getElementById('quote-summary');
const dateDisplay = document.getElementById('current-date');
const quoteIdDisplay = document.getElementById('quote-id');

function updateSummary() {
  let subtotal = 0;
  summaryTable.innerHTML = '';
  checkboxes.forEach(box => {
    if (box.checked) {
      const name = box.dataset.name;
      const cost = parseFloat(box.dataset.cost);
      subtotal += cost;
      const row = document.createElement('tr');
      row.innerHTML = `<td style='padding:6px 4px;'>${name}</td><td style='padding:6px 4px;text-align:right;'>$${cost}</td>`;
      summaryTable.appendChild(row);
    }
  });
  const vatRate = parseFloat(vatInput.value) || 0;
  const vat = subtotal * (vatRate / 100);
  const total = subtotal + vat;
  subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
  vatDisplay.textContent = `$${vat.toFixed(2)}`;
  totalDisplay.textContent = `$${total.toFixed(2)}`;
  vatLabel.textContent = `${vatRate}%`;
}

function resetCalc() {
  checkboxes.forEach(box => box.checked = false);
  updateSummary();
}

function printQuote() {
  window.print();
}

function downloadPDF() {
  const element = document.getElementById(\"quote-container\").cloneNode(true);
  element.querySelectorAll('input').forEach(input => {
    const span = document.createElement('span');
    span.textContent = input.value;
    input.parentNode.replaceChild(span, input);
  });
  html2pdf().set({
    margin: 0,
    filename: 'Quote.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(element).save();
}

function insertDateAndQuoteId() {
  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const id = 'Q-' + today.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  dateDisplay.textContent = dateStr;
  quoteIdDisplay.textContent = id;
}

checkboxes.forEach(box => box.addEventListener('change', updateSummary));
vatInput.addEventListener('input', updateSummary);
updateSummary();
insertDateAndQuoteId();
