
"use strict";

/*
=========================================================
 RasaGo Order Tracking - Frontend Demo
=========================================================

Reads the latest demo order from:
localStorage key: rasagoLastDemoOrder

This page does not receive live updates from a server.
Demo status changes are stored locally in this browser.
*/

const $ = (id) => document.getElementById(id);

const trackingSearchForm = $("trackingSearchForm");
const orderIdInput = $("orderIdInput");
const searchMessage = $("searchMessage");

const noOrderState = $("noOrderState");
const trackingDetails = $("trackingDetails");

const orderReference = $("orderReference");
const orderDate = $("orderDate");
const statusBadge = $("statusBadge");

const statusHeading = $("statusHeading");
const statusDescription = $("statusDescription");
const estimatedTime = $("estimatedTime");

const trackedItems = $("trackedItems");
const trackedSubtotal = $("trackedSubtotal");
const trackedDeliveryFee = $("trackedDeliveryFee");
const trackedTotal = $("trackedTotal");

const trackedCustomer = $("trackedCustomer");
const trackedPhone = $("trackedPhone");
const trackedAddress = $("trackedAddress");
const trackedPayment = $("trackedPayment");
const trackedInstructions = $("trackedInstructions");

const demoStatusSelect = $("demoStatusSelect");
const updateDemoStatus = $("updateDemoStatus");
const demoStatusMessage = $("demoStatusMessage");

let currentOrder = null;

const ORDER_STATUSES = [
    {
        name: "Order Placed",
        heading: "Your order has been placed!",
        description: "We have received your order details.",
        icon: "✓"
    },
    {
        name: "Order Confirmed",
        heading: "Your order is confirmed!",
        description: "Your order has been confirmed in this demo.",
        icon: "✓"
    },
    {
        name: "Preparing Food",
        heading: "Your food is being prepared!",
        description: "Imagine our kitchen preparing your delicious meal.",
        icon: "🍳"
    },
    {
        name: "Out for Delivery",
        heading: "Your food is on its way!",
        description: "Your order is marked as out for delivery in this demo.",
        icon: "🚴"
    },
    {
        name: "Delivered",
        heading: "Enjoy your meal!",
        description: "This demo order has been marked as delivered.",
        icon: "🎉"
    },
    {
        name: "Cancelled",
        heading: "This order was cancelled.",
        description: "The demo order is marked as cancelled.",
        icon: "×"
    }
];

/* =======================================================
   HELPERS
======================================================= */

function formatMoney(amount) {
    const value = Number(amount);

    return "Rs. " + (
        Number.isFinite(value) ? value : 0
    ).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showSearchMessage(message, type = "") {
    searchMessage.textContent = message;
    searchMessage.className = "message";

    if (type) {
        searchMessage.classList.add(type);
    }
}

function getSavedOrder() {
    try {
        const saved = localStorage.getItem("rasagoLastDemoOrder");

        if (!saved) {
            return null;
        }

        const order = JSON.parse(saved);

        if (
            !order ||
            typeof order !== "object" ||
            !order.reference ||
            !Array.isArray(order.items)
        ) {
            return null;
        }

        return order;
    } catch (error) {
        return null;
    }
}

function saveCurrentOrder() {
    try {
        localStorage.setItem(
            "rasagoLastDemoOrder",
            JSON.stringify(currentOrder)
        );

        return true;
    } catch (error) {
        return false;
    }
}

function getOrderStatusIndex(order) {
    const index = Number(order.demoStatusIndex);

    if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < ORDER_STATUSES.length
    ) {
        return index;
    }

    return 0;
}

function formatOrderDate(dateValue) {
    if (!dateValue) {
        return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString("en-LK", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

/* =======================================================
   FIND ORDER
======================================================= */

function findOrder(reference) {
    const order = getSavedOrder();

    if (!order) {
        currentOrder = null;
        showEmptyState();

        showSearchMessage(
            "No saved demo order was found in this browser.",
            "error"
        );

        return;
    }

    if (
        reference &&
        order.reference.toLowerCase() !== reference.trim().toLowerCase()
    ) {
        showSearchMessage(
            "That reference does not match the latest demo order saved in this browser.",
            "error"
        );

        return;
    }

    currentOrder = order;

    orderIdInput.value = order.reference;

    showSearchMessage(
        "Demo order loaded successfully.",
        "success"
    );

    renderOrder();
}

/* =======================================================
   EMPTY STATE
======================================================= */

function showEmptyState() {
    noOrderState.hidden = false;
    trackingDetails.hidden = true;
}

/* =======================================================
   ORDER ITEMS
======================================================= */

function renderItems() {
    trackedItems.replaceChildren();

    currentOrder.items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "tracked-item";

        const details = document.createElement("div");
        const name = document.createElement("h3");
        const description = document.createElement("p");

        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice) || 0;

        name.textContent =
            `${item.name || "Food Item"} × ${quantity}`;

        const customizations = [
            item.rice,
            ...(Array.isArray(item.curries) ? item.curries : []),
            ...(Array.isArray(item.extras) ? item.extras : [])
        ].filter(Boolean);

        description.textContent = customizations.length
            ? customizations.join(", ")
            : "Food order";

        const price = document.createElement("div");
        price.className = "tracked-item-price";
        price.textContent = formatMoney(unitPrice * quantity);

        details.append(name, description);
        row.append(details, price);

        trackedItems.appendChild(row);
    });

    trackedSubtotal.textContent = formatMoney(
        currentOrder.subtotal
    );

    trackedDeliveryFee.textContent = formatMoney(
        currentOrder.deliveryFee
    );

    trackedTotal.textContent = formatMoney(
        currentOrder.total
    );
}

/* =======================================================
   DELIVERY INFORMATION
======================================================= */

function renderDeliveryInformation() {
    trackedCustomer.textContent =
        currentOrder.customerName || "Not provided";

    trackedPhone.textContent =
        currentOrder.phone || "Not provided";

    trackedAddress.textContent =
        currentOrder.address || "Not provided";

    trackedPayment.textContent =
        currentOrder.paymentMethod || "Not specified";

    trackedInstructions.textContent =
        currentOrder.instructions || "No instructions";
}

/* =======================================================
   PROGRESS TRACKER
======================================================= */

function renderProgress(statusIndex) {
    const steps = document.querySelectorAll(".progress-step");

    steps.forEach((step, index) => {
        step.classList.remove("completed", "active");

        const icon = step.querySelector(".step-icon");

        if (statusIndex === 5) {
            // Cancelled orders must not appear delivered.
            icon.textContent = index === 0 ? "✓" : "×";

            if (index === 0) {
                step.classList.add("completed");
            }

            if (index === 1) {
                step.classList.add("active");
            }

            return;
        }

        if (index < statusIndex) {
            step.classList.add("completed");
            icon.textContent = "✓";
        } else if (index === statusIndex) {
            step.classList.add("active");
        } else {
            const defaultIcons = ["✓", "✓", "🍳", "🚴", "🎉"];
            icon.textContent = defaultIcons[index];
        }
    });
}

/* =======================================================
   STATUS DISPLAY
======================================================= */

function renderStatus() {
    const statusIndex = getOrderStatusIndex(currentOrder);
    const status = ORDER_STATUSES[statusIndex];

    statusBadge.textContent = status.name;
    statusBadge.className = "status-badge";

    statusHeading.textContent = status.heading;
    statusDescription.textContent = status.description;

    if (statusIndex === 4) {
        statusBadge.classList.add("delivered");
        estimatedTime.textContent = "Delivery completed in this demo.";
    } else if (statusIndex === 5) {
        statusBadge.classList.add("cancelled");
        estimatedTime.textContent =
            "No delivery estimate is available for a cancelled order.";
    } else {
        const messages = [
            "Estimated delivery: 30–45 minutes (demo estimate).",
            "Estimated delivery: 25–40 minutes (demo estimate).",
            "Estimated delivery: 20–35 minutes (demo estimate).",
            "Estimated delivery: 10–20 minutes (demo estimate)."
        ];

        estimatedTime.textContent = messages[statusIndex];
    }

    demoStatusSelect.value = String(statusIndex);
    renderProgress(statusIndex);
}

/* =======================================================
   RENDER ORDER
======================================================= */

function renderOrder() {
    if (!currentOrder) {
        showEmptyState();
        return;
    }

    noOrderState.hidden = true;
    trackingDetails.hidden = false;

    orderReference.textContent = currentOrder.reference;
    orderDate.textContent = formatOrderDate(currentOrder.createdAt);

    renderStatus();
    renderItems();
    renderDeliveryInformation();
}

/* =======================================================
   SEARCH BY REFERENCE
======================================================= */

trackingSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const reference = orderIdInput.value.trim();

    if (!reference) {
        showSearchMessage(
            "Please enter your order reference.",
            "error"
        );

        return;
    }

    findOrder(reference);
});

/* =======================================================
   DEMO STATUS UPDATE
======================================================= */

updateDemoStatus.addEventListener("click", () => {
    if (!currentOrder) {
        demoStatusMessage.textContent =
            "Load a demo order before changing its status.";

        return;
    }

    const newStatusIndex = Number(demoStatusSelect.value);

    if (
        !Number.isInteger(newStatusIndex) ||
        newStatusIndex < 0 ||
        newStatusIndex >= ORDER_STATUSES.length
    ) {
        demoStatusMessage.textContent = "Invalid demo status.";
        return;
    }

    currentOrder.demoStatusIndex = newStatusIndex;
    currentOrder.status = ORDER_STATUSES[newStatusIndex].name;

    if (!saveCurrentOrder()) {
        demoStatusMessage.textContent =
            "Could not save the demo status in browser storage.";

        return;
    }

    renderOrder();

    demoStatusMessage.textContent =
        `Demo status updated to "${ORDER_STATUSES[newStatusIndex].name}".`;

});

/* =======================================================
   INITIALISE PAGE
======================================================= */

const initialOrder = getSavedOrder();

if (initialOrder) {
    currentOrder = initialOrder;
    orderIdInput.value = initialOrder.reference;
    renderOrder();

    showSearchMessage(
        "Showing your latest saved demo order.",
        "success"
    );
} else {
    showEmptyState();

    showSearchMessage(
        "No demo order found. Place an order first.",
        "error"
    );
}
