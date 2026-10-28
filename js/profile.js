
document.addEventListener("DOMContentLoaded", () => {
    const userKey = "rasagoDemoUser";
    const ordersKey = "rasagoDemoOrders";

    let user;

    try {
        user = JSON.parse(localStorage.getItem(userKey) || "null");
    } catch {
        user = null;
    }

    if (!user) {
        document.getElementById("profileName").textContent = "Guest User";
        document.getElementById("profileEmail").textContent =
            "Create an account to view your profile.";

        document.getElementById("emptyOrders").hidden = false;
        document.getElementById("orderList").hidden = true;
        document.getElementById("editProfileBtn").hidden = true;
        return;
    }

    const name = user.name || "RasaGo User";
    const email = user.email || "Not provided";
    const phone = user.phone || "Not provided";

    document.getElementById("profileName").textContent = name;
    document.getElementById("profileEmail").textContent = email;
    document.getElementById("detailName").textContent = name;
    document.getElementById("detailEmail").textContent = email;
    document.getElementById("detailPhone").textContent = phone;

    document.getElementById("editProfileBtn").addEventListener("click", () => {
        const form = document.getElementById("editProfileForm");
        form.hidden = !form.hidden;

        document.getElementById("editName").value = user.name || "";
        document.getElementById("editEmail").value = user.email || "";
        document.getElementById("editPhone").value = user.phone || "";
    });

    document.getElementById("editProfileForm").addEventListener("submit", event => {
        event.preventDefault();

        user.name = document.getElementById("editName").value.trim();
        user.email = document.getElementById("editEmail").value.trim();
        user.phone = document.getElementById("editPhone").value.trim();

        localStorage.setItem(userKey, JSON.stringify(user));

        document.getElementById("profileName").textContent = user.name;
        document.getElementById("profileEmail").textContent = user.email;
        document.getElementById("detailName").textContent = user.name;
        document.getElementById("detailEmail").textContent = user.email;
        document.getElementById("detailPhone").textContent =
            user.phone || "Not provided";

        document.getElementById("profileMessage").textContent =
            "Profile updated successfully!";
    });

    let orders = [];

    try {
        orders = JSON.parse(localStorage.getItem(ordersKey) || "[]");
        if (!Array.isArray(orders)) orders = [];
    } catch {
        orders = [];
    }

    const list = document.getElementById("orderList");
    const empty = document.getElementById("emptyOrders");

    document.getElementById("orderCount").textContent =
        `${orders.length} ${orders.length === 1 ? "Order" : "Orders"}`;

    if (!orders.length) {
        empty.hidden = false;
        return;
    }

    empty.hidden = true;

    orders.forEach(order => {
        const card = document.createElement("article");
        card.className = "order-card";

        const top = document.createElement("div");
        top.className = "order-card-top";

        const info = document.createElement("div");

        const orderId = document.createElement("div");
        orderId.className = "order-id";
        orderId.textContent = order.id || "Order";

        const date = document.createElement("div");
        date.className = "order-date";
        const parsedDate = new Date(order.date);
        date.textContent = order.date && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleDateString()
            : "Date unavailable";

        info.append(orderId, date);

        const status = document.createElement("span");
        status.className = "order-status";

        const statusText = order.status || "Pending";
        status.textContent = statusText;

        if (statusText.toLowerCase() === "delivered") {
            status.classList.add("delivered");
        } else if (statusText.toLowerCase() === "cancelled") {
            status.classList.add("cancelled");
        }

        top.append(info, status);

        const items = document.createElement("div");
        items.className = "order-items";
        items.textContent = Array.isArray(order.items)
            ? order.items.map(item =>
                `${item.name || "Food"} × ${Number(item.quantity) || 1}`
              ).join(" · ")
            : "Order details unavailable";

        const total = document.createElement("div");
        total.className = "order-total";

        const label = document.createElement("span");
        label.textContent = "Total";

        const amount = document.createElement("strong");
        amount.textContent =
            `LKR ${(Number(order.total) || 0).toLocaleString("en-LK")}`;

        total.append(label, amount);
        card.append(top, items, total);
        list.appendChild(card);
    });
});
