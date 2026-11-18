// =====================================
// MOMPay MANAGER
// =====================================

// LOAD SAVED DATA

let members = JSON.parse(
    localStorage.getItem("mompayMembers")
) || [];

let payments = JSON.parse(
    localStorage.getItem("mompayPayments")
) || [];


// HTML ELEMENTS

const memberForm = document.getElementById("memberForm");
const paymentForm = document.getElementById("paymentForm");

const memberName = document.getElementById("memberName");
const paymentMember = document.getElementById("paymentMember");
const amount = document.getElementById("amount");
const paymentMonth = document.getElementById("paymentMonth");
const paymentYear = document.getElementById("paymentYear");

const membersList = document.getElementById("membersList");
const searchMember = document.getElementById("searchMember");


// GENERATE ID

function generateID() {
    return Date.now().toString() +
        Math.random().toString(36).slice(2);
}


// SAVE DATA

function saveData() {
    localStorage.setItem(
        "mompayMembers",
        JSON.stringify(members)
    );

    localStorage.setItem(
        "mompayPayments",
        JSON.stringify(payments)
    );
}


// GET MEMBER TOTAL

function getMemberTotal(memberId) {
    return payments
        .filter(payment => payment.memberId === memberId)
        .reduce(
            (total, payment) => total + Number(payment.amount),
            0
        );
}


// DASHBOARD

function updateDashboard() {

    const total = payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
    );

    document.getElementById("totalCollected").textContent =
        "GH₵" + total.toFixed(2);

    document.getElementById("totalMembers").textContent =
        members.length;

    document.getElementById("totalPayments").textContent =
        payments.length;

    document.getElementById("reportTotal").textContent =
        "GH₵" + total.toFixed(2);

    document.getElementById("reportPayments").textContent =
        payments.length;
}


// MEMBER DROPDOWN

function updateDropdown() {

    paymentMember.innerHTML =
        '<option value="">Select Member</option>';

    members.forEach(member => {

        const option = document.createElement("option");

        option.value = member.id;
        option.textContent = member.name;

        paymentMember.appendChild(option);

    });

}


// ADD MEMBER

memberForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = memberName.value.trim();

    if (!name) return;

    const duplicate = members.some(
        member => member.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
        alert("This member already exists!");
        return;
    }

    members.push({
        id: generateID(),
        name: name
    });

    saveData();

    memberForm.reset();

    updateDropdown();
    displayMembers();
    updateDashboard();
    updateReports();

    alert("Member added successfully!");

});


// RECORD PAYMENT

paymentForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const memberId = paymentMember.value;
    const paymentAmount = Number(amount.value);
    const month = paymentMonth.value;
    const year = Number(paymentYear.value);

    if (
        !memberId ||
        !month ||
        !Number.isInteger(year) ||
        year < 2020 ||
        year > 2100 ||
        !Number.isFinite(paymentAmount) ||
        paymentAmount <= 0
    ) {
        alert("Please enter valid payment details.");
        return;
    }

    if (!members.some(member => member.id === memberId)) {
        alert("Please select a valid member.");
        return;
    }

    payments.push({
        id: generateID(),
        memberId,
        amount: paymentAmount,
        month,
        year,
        date: new Date().toISOString()
    });

    saveData();

    paymentForm.reset();
    paymentYear.value = new Date().getFullYear();

    updateDashboard();
    displayMembers();
    updateReports();

    alert("Payment recorded successfully!");

});


// SAFE HTML

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);

}


// DISPLAY MEMBERS

function displayMembers(filter = "") {

    membersList.innerHTML = "";

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filteredMembers.length === 0) {
        membersList.innerHTML = "<p>No members found.</p>";
        return;
    }

    filteredMembers.forEach(member => {

        const total = getMemberTotal(member.id);

        const memberPayments = payments.filter(
            payment => payment.memberId === member.id
        );

        const card = document.createElement("div");

        card.className = "member-card";

        card.innerHTML = `
            <div>
                <h4>${escapeHTML(member.name)}</h4>

                <p>${memberPayments.length} payment(s) recorded</p>

                <strong>GH₵${total.toFixed(2)}</strong>

                <div class="member-actions">
                    <button class="history-btn" type="button">
                        View History
                    </button>

                    <button class="delete-member-btn" type="button">
                        Delete Member
                    </button>
                </div>
            </div>
        `;

        card.querySelector(".history-btn").addEventListener(
            "click",
            () => showHistory(member.id)
        );

        card.querySelector(".delete-member-btn").addEventListener(
            "click",
            () => deleteMember(member.id)
        );

        membersList.appendChild(card);

    });

}


// SHOW PAYMENT HISTORY

function showHistory(memberId) {

    const member = members.find(m => m.id === memberId);

    if (!member) return;

    const history = payments
        .filter(payment => payment.memberId === memberId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    document.getElementById("membersList").hidden = true;
    searchMember.hidden = true;

    const profile = document.getElementById("profileSection");

    profile.hidden = false;

    document.getElementById("profileName").textContent =
        member.name;

    document.getElementById("profileTotal").textContent =
        "GH₵" + getMemberTotal(memberId).toFixed(2);

    document.getElementById("profilePayments").textContent =
        history.length;

    const historyContainer =
        document.getElementById("profileHistory");

    historyContainer.innerHTML = "";

    if (history.length === 0) {
        historyContainer.innerHTML =
            "<p>No payments recorded yet.</p>";
        return;
    }

    history.forEach(payment => {

        const item = document.createElement("div");
        item.className = "history-item";

        const details = document.createElement("div");

        const month = document.createElement("strong");
        month.textContent = `${payment.month} ${payment.year}`;

        const date = document.createElement("p");
        date.textContent =
            new Date(payment.date).toLocaleDateString();

        details.append(month, date);

        const paid = document.createElement("strong");
        paid.textContent =
            "GH₵" + Number(payment.amount).toFixed(2);

        const actions = document.createElement("div");
        actions.className = "payment-actions";

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-payment";
        editButton.type = "button";

        editButton.addEventListener("click", () => {
            editPayment(payment.id, memberId);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-payment";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            deletePayment(payment.id, memberId);
        });

        actions.append(editButton, deleteButton);

        item.append(details, paid, actions);

        historyContainer.appendChild(item);

    });

}


// EDIT PAYMENT

function editPayment(paymentId, memberId) {

    const payment = payments.find(p => p.id === paymentId);

    if (!payment) return;

    const newAmount = prompt(
        "Enter corrected amount:",
        payment.amount
    );

    if (newAmount === null) return;

    const amountValue = Number(newAmount);

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
        alert("Invalid amount.");
        return;
    }

    const months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    const newMonth = prompt(
        "Enter payment month:",
        payment.month
    );

    if (newMonth === null) return;

    const selectedMonth = months.find(
        month => month.toLowerCase() === newMonth.trim().toLowerCase()
    );

    if (!selectedMonth) {
        alert("Invalid month.");
        return;
    }

    const newYear = prompt(
        "Enter payment year:",
        payment.year
    );

    if (newYear === null) return;

    const yearValue = Number(newYear);

    if (
        !Number.isInteger(yearValue) ||
        yearValue < 2020 ||
        yearValue > 2100
    ) {
        alert("Invalid year.");
        return;
    }

    payment.amount = amountValue;
    payment.month = selectedMonth;
    payment.year = yearValue;

    saveData();

    updateDashboard();
    displayMembers();
    updateReports();
    showHistory(memberId);

    alert("Payment updated successfully!");

}


// DELETE PAYMENT

function deletePayment(paymentId, memberId) {

    if (!confirm("Delete this payment permanently?")) return;

    payments = payments.filter(
        payment => payment.id !== paymentId
    );

    saveData();

    updateDashboard();
    displayMembers();
    updateReports();
    showHistory(memberId);

    alert("Payment deleted successfully!");

}


// DELETE MEMBER

function deleteMember(memberId) {

    const member = members.find(m => m.id === memberId);

    if (!member) return;

    const confirmed = confirm(
        `Delete ${member.name} and all their payment records?`
    );

    if (!confirmed) return;

    members = members.filter(
        member => member.id !== memberId
    );

    payments = payments.filter(
        payment => payment.memberId !== memberId
    );

    saveData();

    updateDropdown();
    updateDashboard();
    displayMembers(searchMember.value);
    updateReports();

    document.getElementById("profileSection").hidden = true;
    membersList.hidden = false;
    searchMember.hidden = false;

    alert("Member and associated payments deleted.");

}


// BACK TO MEMBERS

document.getElementById("backButton").addEventListener(
    "click",
    function() {

        document.getElementById("profileSection").hidden = true;

        membersList.hidden = false;
        searchMember.hidden = false;

    }
);


// SEARCH MEMBERS

searchMember.addEventListener("input", function() {
    displayMembers(this.value);
});


// MONTHLY REPORTS

function updateReports() {

    const monthlyTotals = {};

    payments.forEach(payment => {

        const key = `${payment.month} ${payment.year}`;

        monthlyTotals[key] =
            (monthlyTotals[key] || 0) + Number(payment.amount);

    });

    const container = document.getElementById("monthlyReports");

    container.innerHTML = "";

    const entries = Object.entries(monthlyTotals);

    if (entries.length === 0) {
        container.innerHTML = "<p>No payment records yet.</p>";
        return;
    }

    entries.forEach(([month, total]) => {

        const row = document.createElement("div");

        row.className = "report-row";

        const label = document.createElement("strong");
        label.textContent = month;

        const value = document.createElement("span");
        value.textContent = "GH₵" + total.toFixed(2);

        row.append(label, value);

        container.appendChild(row);

    });

}


// FULL-SCREEN NAVIGATION

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const closeMenuBtn = document.getElementById("closeMenu");

const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");

function openMenu() {
    sidebar.classList.add("active");
    overlay.classList.add("active");
}

function closeMenu() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
}

function showPage(pageId) {

    const selectedPage = document.getElementById(pageId);

    if (!selectedPage || !selectedPage.classList.contains("page")) {
        return;
    }

    pages.forEach(page => page.classList.remove("active"));

    selectedPage.classList.add("active");

    navLinks.forEach(link => {
        link.classList.toggle(
            "active",
            link.getAttribute("href") === "#" + pageId
        );
    });

    // Reset member profile when leaving Members
    if (pageId !== "members") {
        document.getElementById("profileSection").hidden = true;
        membersList.hidden = false;
        searchMember.hidden = false;
    }

    closeMenu();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

menuToggle.addEventListener("click", openMenu);
closeMenuBtn.addEventListener("click", closeMenu);
overlay.addEventListener("click", closeMenu);

navLinks.forEach(link => {

    link.addEventListener("click", function(event) {

        event.preventDefault();

        const pageId = this.getAttribute("href").substring(1);

        showPage(pageId);

    });

});


// INITIALIZE APPLICATION

function initializeApp() {

    paymentYear.value = new Date().getFullYear();

    updateDashboard();
    updateDropdown();
    displayMembers();
    updateReports();

}

initializeApp();
// WHATSAPP MONTHLY PAYMENT REPORT

const shareButton = document.getElementById("shareWhatsApp");

shareButton.addEventListener("click", function () {

    const month = document.getElementById("shareMonth").value;
    const year = Number(document.getElementById("shareYear").value);

    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
        alert("Please enter a valid year.");
        return;
    }

    let message = `📋 *MOMPAY MANAGER*\n`;
    message += `*MONTHLY PAYMENT REPORT*\n\n`;
    message += `📅 *${month.toUpperCase()} ${year}*\n\n`;

    let totalCollected = 0;
    let membersPaid = 0;

    members.forEach((member, index) => {

        const memberPayments = payments.filter(payment =>
            payment.memberId === member.id &&
            payment.month === month &&
            Number(payment.year) === year
        );

        const memberTotal = memberPayments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
        );

        totalCollected += memberTotal;

        if (memberTotal > 0) {
            membersPaid++;
        }

        message += `${index + 1}. ${member.name}: GH₵${memberTotal.toFixed(2)}\n`;
    });

    message += `\n━━━━━━━━━━━━━━\n`;
    message += `💰 *TOTAL COLLECTED: GH₵${totalCollected.toFixed(2)}*\n`;
    message += `👥 *MEMBERS WHO PAID: ${membersPaid}*\n`;
    message += `👥 *TOTAL MEMBERS: ${members.length}*\n`;
    message += `━━━━━━━━━━━━━━\n`;
    message += `Thank you.`;

    const whatsappURL =
        "https://wa.me/?text=" + encodeURIComponent(message);

    window.open(whatsappURL, "_blank");

});