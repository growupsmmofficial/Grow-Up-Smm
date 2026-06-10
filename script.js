const STORAGE_KEY = "personal_service_manager_data";

let services = loadFromStorage();

const editId = document.getElementById("editId");
const categoryInput = document.getElementById("categoryInput");
const serviceInput = document.getElementById("serviceInput");
const linkInput = document.getElementById("linkInput");
const noteInput = document.getElementById("noteInput");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const categorySelect = document.getElementById("categorySelect");
const serviceSelect = document.getElementById("serviceSelect");
const openBtn = document.getElementById("openBtn");
const selectedPreview = document.getElementById("selectedPreview");
const serviceList = document.getElementById("serviceList");
const searchInput = document.getElementById("searchInput");
const totalCount = document.getElementById("totalCount");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const toast = document.getElementById("toast");

renderAll();

saveBtn.addEventListener("click", saveService);
clearBtn.addEventListener("click", clearForm);
categorySelect.addEventListener("change", loadServicesForCategory);
serviceSelect.addEventListener("change", updatePreview);
openBtn.addEventListener("click", openSelectedService);
searchInput.addEventListener("input", renderServiceList);
exportBtn.addEventListener("click", exportData);
importFile.addEventListener("change", importData);

function loadFromStorage(){
    try{
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }catch{
        return [];
    }
}

function saveToStorage(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
}

function saveService(){
    const category = categoryInput.value.trim();
    const name = serviceInput.value.trim();
    const link = linkInput.value.trim();
    const note = noteInput.value.trim();
    const id = editId.value;

    if(!category || !name || !link){
        showToast("Fill category, service and link");
        return;
    }

    if(!isValidUrl(link)){
        showToast("Enter a valid link starting with http:// or https://");
        return;
    }

    if(id){
        services = services.map(item => {
            if(item.id === id){
                return { ...item, category, name, link, note, updatedAt:new Date().toISOString() };
            }
            return item;
        });
        showToast("Service updated");
    }else{
        services.unshift({
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            category,
            name,
            link,
            note,
            createdAt:new Date().toISOString()
        });
        showToast("Service added");
    }

    saveToStorage();
    clearForm();
    renderAll();
}

function clearForm(){
    editId.value = "";
    categoryInput.value = "";
    serviceInput.value = "";
    linkInput.value = "";
    noteInput.value = "";
    saveBtn.textContent = "Add Service";
}

function renderAll(){
    renderCategorySelect();
    renderServiceList();
    loadServicesForCategory();
}

function getCategories(){
    const categories = services.map(item => item.category);
    return [...new Set(categories)].sort((a,b) => a.localeCompare(b));
}

function renderCategorySelect(){
    const selected = categorySelect.value;
    categorySelect.innerHTML = `<option value="">Select Category</option>`;

    getCategories().forEach(category => {
        categorySelect.innerHTML += `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`;
    });

    categorySelect.value = selected;
}

function loadServicesForCategory(){
    const category = categorySelect.value;
    serviceSelect.innerHTML = `<option value="">Select Service</option>`;

    services
        .filter(item => item.category === category)
        .sort((a,b) => a.name.localeCompare(b.name))
        .forEach(item => {
            serviceSelect.innerHTML += `<option value="${item.id}">${escapeHTML(item.name)}</option>`;
        });

    updatePreview();
}

function updatePreview(){
    const service = getSelectedService();

    if(!service){
        selectedPreview.innerHTML = `<span>No service selected</span>`;
        return;
    }

    selectedPreview.innerHTML = `
        <strong>${escapeHTML(service.name)}</strong>
        <small>${escapeHTML(service.category)}</small>
        <p>${escapeHTML(service.note || "No note added")}</p>
    `;
}

function getSelectedService(){
    return services.find(item => item.id === serviceSelect.value);
}

function openSelectedService(){
    const service = getSelectedService();

    if(!service){
        showToast("Select a service first");
        return;
    }

    window.open(service.link, "_blank");
}

function renderServiceList(){
    const keyword = searchInput.value.toLowerCase().trim();

    const filtered = services.filter(item =>
        item.category.toLowerCase().includes(keyword) ||
        item.name.toLowerCase().includes(keyword) ||
        item.link.toLowerCase().includes(keyword) ||
        (item.note || "").toLowerCase().includes(keyword)
    );

    totalCount.textContent = `${services.length} service${services.length === 1 ? "" : "s"} saved`;

    if(filtered.length === 0){
        serviceList.innerHTML = `
            <div class="empty">
                <h3>No services found</h3>
                <p>Add your first category, service and link.</p>
            </div>
        `;
        return;
    }

    serviceList.innerHTML = filtered.map(item => `
        <div class="service-card">
            <span class="category-pill">${escapeHTML(item.category)}</span>
            <h4>${escapeHTML(item.name)}</h4>
            <p>${escapeHTML(item.note || "No note added")}</p>
            <p>${escapeHTML(item.link)}</p>
            <div class="card-actions">
                <button class="open-small" onclick="openById('${item.id}')">Open</button>
                <button class="edit-small" onclick="editById('${item.id}')">Edit</button>
                <button class="delete-small" onclick="deleteById('${item.id}')">Delete</button>
            </div>
        </div>
    `).join("");
}

window.openById = function(id){
    const item = services.find(service => service.id === id);
    if(item){
        window.open(item.link, "_blank");
    }
};

window.editById = function(id){
    const item = services.find(service => service.id === id);
    if(!item) return;

    editId.value = item.id;
    categoryInput.value = item.category;
    serviceInput.value = item.name;
    linkInput.value = item.link;
    noteInput.value = item.note || "";
    saveBtn.textContent = "Update Service";
    window.scrollTo({ top:0, behavior:"smooth" });
};

window.deleteById = function(id){
    const item = services.find(service => service.id === id);
    if(!item) return;

    const ok = confirm(`Delete ${item.name}?`);
    if(!ok) return;

    services = services.filter(service => service.id !== id);
    saveToStorage();
    renderAll();
    showToast("Service deleted");
};

function exportData(){
    const data = JSON.stringify(services, null, 2);
    const blob = new Blob([data], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "service-manager-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup exported");
}

function importData(e){
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = function(){
        try{
            const imported = JSON.parse(reader.result);

            if(!Array.isArray(imported)){
                throw new Error("Invalid backup file");
            }

            services = imported.map(item => ({
                id:item.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
                category:String(item.category || "General"),
                name:String(item.name || item.service || "Service"),
                link:String(item.link || ""),
                note:String(item.note || ""),
                createdAt:item.createdAt || new Date().toISOString()
            })).filter(item => item.link);

            saveToStorage();
            renderAll();
            showToast("Backup imported");
        }catch(error){
            showToast(error.message || "Import failed");
        }
    };

    reader.readAsText(file);
    e.target.value = "";
}

function isValidUrl(value){
    try{
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    }catch{
        return false;
    }
}

function showToast(message){
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
}

function escapeHTML(value){
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
