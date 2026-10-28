
"use strict";

/*
=========================================================
 RasaGo Checkout - Frontend Demo
=========================================================

 IMPORTANT:
 1. Replace DELIVERY_LOCATION with your actual delivery point.
 2. This calculates straight-line GPS distance, not road distance.
 3. Online payment is a demo only. No real payment is processed.
 4. Never store card number, expiry date or CVV.
 5. Cart storage key: rasagoDemoCart
*/

// Replace these SAMPLE coordinates with your real delivery point.
const DELIVERY_LOCATION = {
    latitude: 6.9367,
    longitude: 79.9842
};

const MAX_DELIVERY_DISTANCE_KM = 10;
const DELIVERY_FEE = 300;

const $ = (id) => document.getElementById(id);

// Cart elements
const cartItemsElement = $("cartItems");
const emptyCartElement = $("emptyCart");
const subtotalElement = $("subtotal");
const deliveryFeeElement = $("deliveryFee");
const totalElement = $("total");

// Location elements
const locationBtn = $("locationBtn");
const locationStatus = $("locationStatus");

// Form elements
const checkoutForm = $("checkoutForm");
const placeOrderBtn = $("placeOrderBtn");
const orderMessage = $("orderMessage");

// Payment elements
const cardPaymentSection = $("cardPaymentSection");
const cardholderName = $("cardholderName");
const cardNumber = $("cardNumber");
const cardExpiry = $("cardExpiry");
const cardCvv = $("cardCvv");
const cardError = $("cardError");

// Success popup elements
const successModal = $("successModal");
const successMessage = $("successMessage");
const successOrderReference = $("successOrderReference");
const successPaymentInfo = $("successPaymentInfo");
const closeSuccessModal = $("closeSuccessModal");

let cart = [];
let subtotal = 0;
let customerCoordinates = null;
let locationVerified = false;
let orderSubmitting = false;
let locationRequestInProgress = false;

/* =======================================================
   CART
======================================================= */

function formatMoney(amount) {
    return "Rs. " + Number(amount).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getItemPrice(item) {
    const price = Number(item.unitPrice);
    const quantity = Number(item.quantity);

    if (
        !Number.isFinite(price) ||
        !Number.isFinite(quantity) ||
        price < 0 ||
        quantity < 1
    ) {
        return 0;
    }

    return price * quantity;
}

function loadCart() {
    try {
        const savedCart = JSON.parse(
            localStorage.getItem("rasagoDemoCart") || "[]"
        );

        cart = Array.isArray(savedCart) ? savedCart : [];
    } catch (error) {
        cart = [];
    }

    renderCart();
}

function renderCart() {
    cartItemsElement.replaceChildren();
    subtotal = 0;

    const hasItems = cart.length > 0;
    emptyCartElement.hidden = hasItems;

    cart.forEach((item) => {
        const itemTotal = getItemPrice(item);
        subtotal += itemTotal;

        const row = document.createElement("div");
        row.className = "cart-item";

        const details = document.createElement("div");
        const name = document.createElement("h3");
        const description = document.createElement("p");
        const price = document.createElement("div");

        const quantity = Number(item.quantity) || 1;

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

        price.className = "cart-item-price";
        price.textContent = formatMoney(itemTotal);

        details.append(name, description);
        row.append(details, price);
        cartItemsElement.appendChild(row);
    });

    const deliveryFee = hasItems ? DELIVERY_FEE : 0;

    subtotalElement.textContent = formatMoney(subtotal);
    deliveryFeeElement.textContent = formatMoney(deliveryFee);
    totalElement.textContent = formatMoney(subtotal + deliveryFee);

    updateOrderButton();
}

/* =======================================================
   DISTANCE CALCULATION
======================================================= */

// Calculates straight-line distance between two GPS coordinates.
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;

    const toRadians = (degrees) => degrees * Math.PI / 180;

    const latitudeDifference = toRadians(lat2 - lat1);
    const longitudeDifference = toRadians(lon2 - lon1);

    const a =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(longitudeDifference / 2) ** 2;

    const safeA = Math.min(1, Math.max(0, a));

    return earthRadiusKm * 2 * Math.atan2(
        Math.sqrt(safeA),
        Math.sqrt(1 - safeA)
    );
}

function isDeliveryLocationConfigured() {
    return (
        Number.isFinite(DELIVERY_LOCATION.latitude) &&
        Number.isFinite(DELIVERY_LOCATION.longitude) &&
        Math.abs(DELIVERY_LOCATION.latitude) <= 90 &&
        Math.abs(DELIVERY_LOCATION.longitude) <= 180
    );
}

function setLocationStatus(message, type = "") {
    locationStatus.textContent = message;
    locationStatus.className = "location-status";

    if (type) {
        locationStatus.classList.add(type);
    }
}

/* =======================================================
   ORDER BUTTON STATE
======================================================= */

function updateOrderButton() {
    if (cart.length === 0) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = "Your Cart Is Empty";
        return;
    }

    if (orderSubmitting) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = "Processing...";
        return;
    }

    if (!locationVerified) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = "Check Location to Order";
        return;
    }

    placeOrderBtn.disabled = false;

    const selectedPayment = document.querySelector(
        'input[name="payment"]:checked'
    );

    const paymentText =
        selectedPayment?.value === "Online Payment"
            ? "Pay Now"
            : "Place Order";

    placeOrderBtn.textContent =
        `${paymentText} • ${formatMoney(subtotal + DELIVERY_FEE)}`;
}

/* =======================================================
   CUSTOMER LOCATION
======================================================= */

function checkCustomerLocation() {
    if (locationRequestInProgress || orderSubmitting) {
        return;
    }

    orderMessage.textContent = "";
    orderMessage.className = "order-message";

    if (cart.length === 0) {
        setLocationStatus(
            "Please add food items to your cart first.",
            "error"
        );
        return;
    }

    if (!isDeliveryLocationConfigured()) {
        setLocationStatus(
            "The delivery location coordinates are not configured correctly.",
            "error"
        );
        return;
    }

    if (!navigator.geolocation) {
        setLocationStatus(
            "Your browser does not support location services.",
            "error"
        );
        return;
    }

    locationRequestInProgress = true;
    locationVerified = false;
    customerCoordinates = null;

    locationBtn.disabled = true;
    locationBtn.textContent = "Getting Location...";

    updateOrderButton();

    navigator.geolocation.getCurrentPosition(
        (position) => {
            locationRequestInProgress = false;
            locationBtn.disabled = false;

            customerCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            const distance = calculateDistanceKm(
                customerCoordinates.latitude,
                customerCoordinates.longitude,
                DELIVERY_LOCATION.latitude,
                DELIVERY_LOCATION.longitude
            );

            locationBtn.textContent = "Check My Location Again";

            if (distance <= MAX_DELIVERY_DISTANCE_KM) {
                locationVerified = true;

                setLocationStatus(
                    `Delivery available! You are approximately ${distance.toFixed(2)} km away.`,
                    "success"
                );
            } else {
                locationVerified = false;

                setLocationStatus(
                    `Sorry! You are approximately ${distance.toFixed(2)} km away. Delivery is available only within 10 km.`,
                    "error"
                );
            }

            updateOrderButton();
        },

        (error) => {
            locationRequestInProgress = false;
            locationVerified = false;
            customerCoordinates = null;

            locationBtn.disabled = false;
            locationBtn.textContent = "Try Getting My Location Again";

            let message =
                "Could not get your location. Please try again.";

            if (error.code === error.PERMISSION_DENIED) {
                message =
                    "Location permission was denied. Allow location access in your browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message =
                    "Your location is unavailable. Check your device location settings.";
            } else if (error.code === error.TIMEOUT) {
                message =
                    "Location request timed out. Please try again.";
            }

            setLocationStatus(message, "error");
            updateOrderButton();
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

locationBtn.addEventListener("click", checkCustomerLocation);

/* =======================================================
   DELIVERY DETAILS CHANGE
======================================================= */

// Require another location check if the delivery details change.
[
    "customerName",
    "customerPhone",
    "deliveryAddress"
].forEach((id) => {
    $(id).addEventListener("input", () => {
        if (locationVerified) {
            locationVerified = false;
            customerCoordinates = null;

            setLocationStatus(
                "Delivery details changed. Check your location again."
            );

            updateOrderButton();
        }
    });
});

/* =======================================================
   PAYMENT METHOD SELECTION
======================================================= */

function updatePaymentMethod() {
    const selected = document.querySelector(
        'input[name="payment"]:checked'
    );

    const isOnlinePayment =
        selected?.value === "Online Payment";

    cardPaymentSection.hidden = !isOnlinePayment;
    cardError.textContent = "";

    if (!isOnlinePayment) {
        // Clear the form when switching back to COD.
        cardholderName.value = "";
        cardNumber.value = "";
        cardExpiry.value = "";
        cardCvv.value = "";
    }

    updateOrderButton();
}

document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener("change", updatePaymentMethod);
});

/* =======================================================
   DEMO CARD INPUT FORMATTING
======================================================= */

cardNumber.addEventListener("input", () => {
    const digits = cardNumber.value
        .replace(/\D/g, "")
        .slice(0, 19);

    cardNumber.value = digits
        .replace(/(.{4})/g, "$1 ")
        .trim();

    cardError.textContent = "";
});

cardExpiry.addEventListener("input", () => {
    const digits = cardExpiry.value
        .replace(/\D/g, "")
        .slice(0, 4);

    cardExpiry.value = digits.length > 2
        ? digits.slice(0, 2) + "/" + digits.slice(2)
        : digits;

    cardError.textContent = "";
});

cardCvv.addEventListener("input", () => {
    cardCvv.value = cardCvv.value
        .replace(/\D/g, "")
        .slice(0, 4);

    cardError.textContent = "";
});

/* =======================================================
   DEMO CARD VALIDATION
======================================================= */

function validateDemoCard() {
    const name = cardholderName.value.trim();
    const number = cardNumber.value.replace(/\D/g, "");
    const expiry = cardExpiry.value.trim();
    const cvv = cardCvv.value.trim();

    if (!name) {
        return "Please enter the name on your demo card.";
    }

    if (!/^\d{13,19}$/.test(number)) {
        return "Enter a valid demo card number format.";
    }

    // Luhn checksum validates number format only.
    // It does NOT verify that a card exists or is authorised.
    let sum = 0;
    let doubleDigit = false;

    for (let i = number.length - 1; i >= 0; i--) {
        let digit = Number(number[i]);

        if (doubleDigit) {
            digit *= 2;

            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        doubleDigit = !doubleDigit;
    }

    if (sum % 10 !== 0) {
        return "The demo card number format is invalid.";
    }

    const match = expiry.match(
        /^(0[1-9]|1[0-2])\/(\d{2})$/
    );

    if (!match) {
        return "Enter the expiry date in MM/YY format.";
    }

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const now = new Date();

    // The card expires at the end of the stated month.
    if (
        year < now.getFullYear() ||
        (year === now.getFullYear() && month < now.getMonth() + 1)
    ) {
        return "The expiry date has passed.";
    }

    if (!/^\d{3,4}$/.test(cvv)) {
        return "Enter a 3 or 4 digit demo CVV.";
    }

    return "";
}

/* =======================================================
   THANK YOU POPUP
======================================================= */

function showSuccessPopup(reference, paymentMethod) {
    successOrderReference.textContent = reference;

    if (paymentMethod === "Online Payment") {
        successMessage.textContent =
            "Thank you for choosing RasaGo! Your demo checkout is complete.";

        successPaymentInfo.textContent =
            "Demo payment confirmed. No money was charged.";
    } else {
        successMessage.textContent =
            "Thank you for your order! We appreciate your choice.";

        successPaymentInfo.textContent =
            "Payment method: Cash on Delivery. Pay when your food arrives.";
    }

    successModal.hidden = false;
    closeSuccessModal.focus();
}

function closePopup() {
    successModal.hidden = true;
    window.location.href = "menu.html";
}

closeSuccessModal.addEventListener("click", closePopup);

successModal.addEventListener("click", (event) => {
    if (event.target === successModal) {
        closePopup();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !successModal.hidden) {
        closePopup();
    }
});

/* =======================================================
   PLACE ORDER / DEMO PAYMENT
======================================================= */

checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (orderSubmitting) {
        return;
    }

    orderMessage.textContent = "";
    orderMessage.className = "order-message";
    cardError.textContent = "";

    if (cart.length === 0) {
        orderMessage.textContent = "Your cart is empty.";
        orderMessage.classList.add("error");
        updateOrderButton();
        return;
    }

    if (!checkoutForm.reportValidity()) {
        return;
    }

    if (!locationVerified || !customerCoordinates) {
        orderMessage.textContent =
            "Please verify that your location is within the 10 km delivery area.";

        orderMessage.classList.add("error");
        updateOrderButton();
        return;
    }

    const selectedPayment = document.querySelector(
        'input[name="payment"]:checked'
    );

    const paymentMethod = selectedPayment
        ? selectedPayment.value
        : "Cash on Delivery";

    // Online payment: validate demo card fields.
    if (paymentMethod === "Online Payment") {
        const validationError = validateDemoCard();

        if (validationError) {
            cardError.textContent = validationError;
            return;
        }
    }

    // Check the distance again immediately before confirmation.
    const distance = calculateDistanceKm(
        customerCoordinates.latitude,
        customerCoordinates.longitude,
        DELIVERY_LOCATION.latitude,
        DELIVERY_LOCATION.longitude
    );

    if (distance > MAX_DELIVERY_DISTANCE_KM) {
        locationVerified = false;

        setLocationStatus(
            "Your location is outside the 10 km delivery area.",
            "error"
        );

        updateOrderButton();
        return;
    }

    const orderReference =
        "RG" + Date.now().toString().slice(-8);

    /*
      Intentionally do NOT save card number, expiry or CVV.
      This order is only a local frontend demonstration.
    */
    const demoOrder = {
        reference: orderReference,

        customerName: $("customerName").value.trim(),
        phone: $("customerPhone").value.trim(),
        address: $("deliveryAddress").value.trim(),
        instructions: $("instructions").value.trim(),

        paymentMethod: paymentMethod,

        items: cart,

        subtotal: subtotal,
        deliveryFee: DELIVERY_FEE,
        total: subtotal + DELIVERY_FEE,

        distanceKm: Number(distance.toFixed(2)),
        createdAt: new Date().toISOString(),

        status: "Demo only - not sent to a server"
    };

    orderSubmitting = true;
    updateOrderButton();

    try {
        localStorage.setItem(
            "rasagoLastDemoOrder",
            JSON.stringify(demoOrder)
        );

        localStorage.removeItem("rasagoDemoCart");

        cart = [];
        locationVerified = false;
        customerCoordinates = null;

        renderCart();

        setLocationStatus(
            "Location was checked for this demo order.",
            "success"
        );

        orderMessage.textContent = "";

        showSuccessPopup(orderReference, paymentMethod);

        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = "Demo Order Completed";
    } catch (error) {
        orderMessage.textContent =
            "Unable to save the demo order. Check your browser storage settings.";

        orderMessage.classList.add("error");

        orderSubmitting = false;
        updateOrderButton();
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const trackBtn = document.getElementById("trackMyOrderBtn");
    const continueBtn = document.getElementById("continueShoppingBtn");

    if (trackBtn) {
        trackBtn.addEventListener("click", () => {
            window.location.href = "order-tracking.html";
        });
    }

    if (continueBtn) {
        continueBtn.addEventListener("click", () => {
            window.location.href = "menu.html";
        });
    }
});
/* =======================================================
   INITIALISE CHECKOUT
======================================================= */

updatePaymentMethod();
loadCart();
