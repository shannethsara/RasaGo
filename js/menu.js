
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const $ = id => document.getElementById(id);
    const money = value => `LKR ${Number(value).toLocaleString("en-LK")}`;

    const foods = [
        {
            id: "rice",
            category: "rice",
            name: "Rice & Curry",
            price: 350,
            image: "assets/images/foods/rice-and-curry.jpg",
            description: "Build your own Sri Lankan rice and curry plate."
        },
        {
            id: "string-hoppers",
            category: "string-hoppers",
            name: "String Hoppers",
            price: 200,
            image: "assets/images/foods/string-hoppers.jpg",
            description: "Soft string hoppers with your choice of extras."
        },
        {
            id: "hoppers",
            category: "hoppers",
            name: "Plain Hoppers",
            price: 120,
            image: "assets/images/foods/hoppers.jpg",
            description: "Crispy-edged traditional Sri Lankan hoppers."
        },
        {
            id: "egg-hopper",
            category: "hoppers",
            name: "Egg Hopper",
            price: 220,
            image: "assets/images/foods/egg-hopper.jpg",
            description: "A freshly prepared hopper with egg."
        },
        {
            id: "rotti",
            category: "rotti",
            name: "Pol Rotti",
            price: 150,
            image: "assets/images/foods/rotti.jpg",
            description: "Traditional coconut rotti, freshly prepared."
        },
        {
            id: "kottu",
            category: "kottu",
            name: "Chicken Kottu",
            price: 950,
            image: "assets/images/foods/chicken-kottu.jpg",
            description: "Chopped rotti tossed with chicken and vegetables."
        },
        {
            id: "noodles",
            category: "noodles",
            name: "Chicken Noodles",
            price: 850,
            image: "assets/images/foods/chicken-noodles.jpg",
            description: "Stir-fried noodles with chicken and vegetables."
        },
        {
            id: "pasta",
            category: "pasta",
            name: "Chicken Pasta",
            price: 900,
            image: "assets/images/foods/chicken-pasta.jpg",
            description: "Pasta with chicken and a delicious sauce."
        }
    ];

    const categoryNames = {
        all: "All Foods",
        rice: "Rice & Curry",
        "string-hoppers": "String Hoppers",
        hoppers: "Hoppers",
        rotti: "Rotti",
        kottu: "Kottu",
        noodles: "Noodles",
        pasta: "Pasta"
    };

    const riceTypes = [
        { id: "white-rice", name: "White Rice", price: 0 },
        { id: "red-rice", name: "Red Rice", price: 50 }
    ];

    const curries = [
        { id: "chicken-curry", name: "Chicken Curry", price: 250 },
        { id: "fish-curry", name: "Fish Curry", price: 220 },
        { id: "dhal-curry", name: "Dhal Curry", price: 80 },
        { id: "potato-curry", name: "Potato Curry", price: 100 },
        { id: "beans-curry", name: "Green Beans Curry", price: 100 },
        { id: "jackfruit-curry", name: "Jackfruit Curry", price: 150 },
        { id: "egg", name: "Boiled Egg", price: 100 },
        { id: "pol-sambol", name: "Pol Sambol", price: 70 }
    ];

    const extras = [
        { id: "extra-curry", name: "Extra Curry", price: 100 },
        { id: "extra-sambol", name: "Extra Pol Sambol", price: 70 },
        { id: "extra-egg", name: "Extra Egg", price: 100 }
    ];

    let activeCategory = "all";
    let searchTerm = "";
    let selectedFood = null;
    let customQty = 1;
    let cart = [];

    const foodSearch = $("foodSearch");
    const customizeModal = $("customizeModal");
    const cartModal = $("cartModal");

    // Load demo cart
    try {
        const saved = JSON.parse(localStorage.getItem("rasagoDemoCart") || "[]");
        if (Array.isArray(saved)) {
            cart = saved.filter(item =>
                item &&
                typeof item.cartId === "string" &&
                typeof item.name === "string" &&
                Number.isFinite(Number(item.unitPrice)) &&
                Number.isFinite(Number(item.quantity)) &&
                Number(item.unitPrice) >= 0 &&
                Number(item.quantity) > 0
            );
        }
    } catch {
        cart = [];
    }

    function saveCart() {
        try {
            localStorage.setItem("rasagoDemoCart", JSON.stringify(cart));
        } catch (error) {
            console.error("Unable to save cart", error);
        }
        renderCart();
    }

    // ==========================================
    // FOOD SEARCH + RENDER
    // ==========================================

    function renderFoods() {
        const foodGrid = $("foodGrid");
        if (!foodGrid) return;

        const hero = document.querySelector(".menu-hero");
        const categories = document.querySelector(".categories-section");
        const foodSection = document.querySelector(".food-section");

        const isSearching = searchTerm.length > 0;

        // IMPORTANT: Do not hide the hero because it contains the search bar.
        // Hide only the heading and paragraph inside the hero.
        if (hero) {
            hero.classList.toggle("searching", isSearching);
        }

        if (categories) {
            categories.hidden = isSearching;
        }

        if (foodSection) {
            foodSection.classList.toggle("search-results-active", isSearching);
        }

        const results = foods.filter(food => {
            const matchesCategory =
                activeCategory === "all" || food.category === activeCategory;

            const searchableText = [
                food.name,
                food.description,
                categoryNames[food.category],
                food.category
            ].join(" ").toLowerCase();

            return matchesCategory && searchableText.includes(searchTerm);
        });

        foodGrid.replaceChildren();

        $("foodHeading").textContent = isSearching
            ? "Search Results"
            : categoryNames[activeCategory];

        $("foodSubheading").textContent = isSearching
            ? `Results for "${foodSearch.value.trim()}"`
            : activeCategory === "rice"
                ? "Choose your rice and add the curries you love."
                : "Find something delicious for today.";

        $("foodResultCount").textContent =
            `${results.length} ${results.length === 1 ? "item" : "items"}`;

        $("noFoods").hidden = results.length !== 0;

        results.forEach(food => {
            const card = document.createElement("article");
            card.className = "food-card";

            const imageBox = document.createElement("div");
            imageBox.className = "food-image";

            const image = document.createElement("img");
            image.src = food.image;
            image.alt = food.name;
            image.loading = "lazy";

            image.addEventListener("error", () => {
                image.remove();
                imageBox.classList.add("image-missing");
                imageBox.textContent = "🍽️";
            }, { once: true });

            imageBox.appendChild(image);

            const content = document.createElement("div");
            content.className = "food-content";

            const category = document.createElement("span");
            category.className = "food-category-label";
            category.textContent = categoryNames[food.category];

            const title = document.createElement("h3");
            title.textContent = food.name;

            const description = document.createElement("p");
            description.textContent = food.description;

            const bottom = document.createElement("div");
            bottom.className = "food-card-bottom";

            const price = document.createElement("strong");
            price.className = "food-price";
            price.textContent = `From ${money(food.price)}`;

            const customize = document.createElement("button");
            customize.type = "button";
            customize.className = "food-add-btn";
            customize.textContent = "Customise +";
            customize.addEventListener("click", () => openCustomize(food));

            bottom.append(price, customize);
            content.append(category, title, description, bottom);
            card.append(imageBox, content);
            foodGrid.appendChild(card);
        });
    }

    // Search input stays visible as user types
    if (foodSearch) {
        foodSearch.addEventListener("input", () => {
            searchTerm = foodSearch.value.trim().toLowerCase();
            renderFoods();
        });
    }

    function clearSearch() {
        if (foodSearch) foodSearch.value = "";
        searchTerm = "";
        activeCategory = "all";

        document.querySelectorAll(".category-card").forEach(card => {
            card.classList.toggle("active", card.dataset.category === "all");
        });

        renderFoods();
    }

    $("clearSearch")?.addEventListener("click", clearSearch);
    $("resetSearch")?.addEventListener("click", clearSearch);

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            foodSearch &&
            document.activeElement === foodSearch
        ) {
            clearSearch();
            foodSearch.blur();
        }
    });

    // ==========================================
    // CATEGORY FILTER
    // ==========================================

    $("categoryGrid")?.addEventListener("click", event => {
        const button = event.target.closest("[data-category]");
        if (!button) return;

        activeCategory = button.dataset.category;

        document.querySelectorAll(".category-card").forEach(card => {
            card.classList.toggle("active", card === button);
        });

        renderFoods();
        $("foodMenu").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // ==========================================
    // CUSTOMIZATION CHOICES
    // ==========================================

    function renderRadioChoices(container, items, groupName) {
        container.replaceChildren();

        items.forEach((item, index) => {
            const label = document.createElement("label");
            label.className = "choice-option";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = groupName;
            input.value = item.id;
            input.checked = index === 0;

            const name = document.createElement("span");
            name.textContent = item.name;

            const price = document.createElement("small");
            price.textContent = item.price ? `+ ${money(item.price)}` : "Included";

            label.append(input, name, price);
            container.appendChild(label);
        });
    }

    function renderCheckboxChoices(container, items, groupName) {
        container.replaceChildren();

        items.forEach(item => {
            const label = document.createElement("label");
            label.className = "curry-option";

            const input = document.createElement("input");
            input.type = "checkbox";
            input.name = groupName;
            input.value = item.id;

            const name = document.createElement("span");
            name.textContent = item.name;

            const price = document.createElement("small");
            price.textContent = `+ ${money(item.price)}`;

            label.append(input, name, price);
            container.appendChild(label);
        });
    }

    function openCustomize(food) {
        selectedFood = food;
        customQty = 1;

        $("customizeTitle").textContent =
            food.id === "rice" ? "Build Your Rice & Curry" : food.name;

        $("customizeDescription").textContent = food.description;
        $("customMessage").textContent = "";

        const isRice = food.id === "rice";
        $("riceOptions").hidden = !isRice;
        $("standardOptions").hidden = isRice;

        if (isRice) {
            renderRadioChoices($("riceChoices"), riceTypes, "riceType");
            renderCheckboxChoices($("curryChoices"), curries, "curry");
        } else {
            $("portionHeading").textContent = `Choose Quantity of ${food.name}`;
            $("customQty").textContent = customQty;
            renderCheckboxChoices($("extraChoices"), extras, "extra");
        }

        updateCustomTotal();
        customizeModal.hidden = false;
    }

    function selectedCheckboxes(container, items) {
        const ids = Array.from(
            container.querySelectorAll('input[type="checkbox"]:checked')
        ).map(input => input.value);

        return items.filter(item => ids.includes(item.id));
    }

    function getSelection() {
        if (!selectedFood) return null;

        if (selectedFood.id === "rice") {
            const riceId = document.querySelector(
                'input[name="riceType"]:checked'
            )?.value;

            const rice = riceTypes.find(item => item.id === riceId);
            const selectedCurries = selectedCheckboxes($("curryChoices"), curries);

            return {
                name: "Rice & Curry",
                quantity: 1,
                rice: rice || null,
                curries: selectedCurries,
                extras: [],
                unitPrice: selectedFood.price +
                    (rice ? rice.price : 0) +
                    selectedCurries.reduce((sum, item) => sum + item.price, 0)
            };
        }

        const selectedExtras = selectedCheckboxes($("extraChoices"), extras);

        return {
            name: selectedFood.name,
            quantity: customQty,
            rice: null,
            curries: [],
            extras: selectedExtras,
            unitPrice: selectedFood.price +
                selectedExtras.reduce((sum, item) => sum + item.price, 0)
        };
    }

    function updateCustomTotal() {
        const selection = getSelection();
        if (!selection) return;

        $("customTotal").textContent =
            money(selection.unitPrice * selection.quantity);
    }

    document.addEventListener("change", event => {
        if (customizeModal?.contains(event.target)) {
            updateCustomTotal();
        }
    });

    $("decreaseQty").addEventListener("click", () => {
        customQty = Math.max(1, customQty - 1);
        $("customQty").textContent = customQty;
        updateCustomTotal();
    });

    $("increaseQty").addEventListener("click", () => {
        customQty = Math.min(50, customQty + 1);
        $("customQty").textContent = customQty;
        updateCustomTotal();
    });

    $("closeCustomize").addEventListener("click", () => {
        customizeModal.hidden = true;
    });

    customizeModal.addEventListener("click", event => {
        if (event.target === customizeModal) customizeModal.hidden = true;
    });

    // ==========================================
    // CART
    // ==========================================

    function addSelectedFoodToCart() {
        const selection = getSelection();
        if (!selection) return false;

        if (selectedFood.id === "rice" && selection.curries.length === 0) {
            $("customMessage").textContent =
                "Please select at least one curry for your rice and curry meal.";
            return false;
        }

        cart.push({
            cartId: `${selectedFood.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            foodId: selectedFood.id,
            name: selection.name,
            quantity: selection.quantity,
            unitPrice: selection.unitPrice,
            rice: selection.rice?.name || "",
            curries: selection.curries.map(item => item.name),
            extras: selection.extras.map(item => item.name)
        });

        saveCart();
        return true;
    }

    $("confirmAddCart").addEventListener("click", () => {
        if (addSelectedFoodToCart()) customizeModal.hidden = true;
    });

    $("orderNowBtn").addEventListener("click", () => {
        if (!addSelectedFoodToCart()) return;
        customizeModal.hidden = true;
        window.location.href = "checkout.html";
    });

    function renderCart() {
        const container = $("cartItems");
        container.replaceChildren();

        const count = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
        const total = cart.reduce(
            (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
            0
        );

        $("cartCount").textContent = count;
        $("cartTotal").textContent = money(total);
        $("emptyCart").hidden = cart.length > 0;
        $("cartFooter").hidden = cart.length === 0;

        cart.forEach(item => {
            const card = document.createElement("div");
            card.className = "cart-item";

            const title = document.createElement("h3");
            title.textContent = item.name;

            const details = document.createElement("p");
            const options = [];

            if (item.rice) options.push(item.rice);
            if (item.curries?.length) options.push(...item.curries);
            if (item.extras?.length) options.push(...item.extras);

            details.textContent = options.length
                ? options.join(", ")
                : "Standard selection";

            const price = document.createElement("strong");
            price.textContent = money(Number(item.unitPrice) * Number(item.quantity));

            const controls = document.createElement("div");
            controls.className = "cart-item-actions";

            const minus = document.createElement("button");
            minus.type = "button";
            minus.textContent = "−";
            minus.addEventListener("click", () => {
                item.quantity = Number(item.quantity) - 1;

                if (item.quantity <= 0) {
                    cart = cart.filter(entry => entry.cartId !== item.cartId);
                }

                saveCart();
            });

            const quantity = document.createElement("span");
            quantity.textContent = item.quantity;

            const plus = document.createElement("button");
            plus.type = "button";
            plus.textContent = "+";
            plus.addEventListener("click", () => {
                if (Number(item.quantity) < 50) {
                    item.quantity = Number(item.quantity) + 1;
                }
                saveCart();
            });

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Remove";
            remove.addEventListener("click", () => {
                cart = cart.filter(entry => entry.cartId !== item.cartId);
                saveCart();
            });

            controls.append(minus, quantity, plus, remove);
            card.append(title, details, price, controls);
            container.appendChild(card);
        });
    }

    $("openCart").addEventListener("click", () => {
        renderCart();
        cartModal.hidden = false;
    });

    $("closeCart").addEventListener("click", () => {
        cartModal.hidden = true;
    });

    cartModal.addEventListener("click", event => {
        if (event.target === cartModal) cartModal.hidden = true;
    });

    $("checkoutButton").addEventListener("click", () => {
        if (cart.length > 0) window.location.href = "checkout.html";
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            if (customizeModal) customizeModal.hidden = true;
            if (cartModal) cartModal.hidden = true;
        }
    });

    // INITIAL RENDER
    renderFoods();
    renderCart();
});
