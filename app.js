const DATA_FILE_PATH = 'data.json'
const APP_STATE = {
    inventory: [],
    isLoggedIn: false
}
const ELEMENTS = {
    app: document.getElementById('app'),
    authToggle: null,
    inventoryBody: null,
    inventoryTable: null,
    filterInput: null,
    inventoryContainer: null
}

const fetchData = async () => {
    try {
        const response = await fetch(DATA_FILE_PATH)
        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        return data.inventory || []
    } catch (error) {
        console.error('Error fetching data:', error)
        return []
    }
}

const saveData = async (data) => {
    try {
        const payload = { inventory: data }
        const response = await fetch(DATA_FILE_PATH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        return response.ok
    } catch (error) {
        console.error('Error saving data:', error)
        return false
    }
}

const toggleAuth = () => {
    APP_STATE.isLoggedIn = !APP_STATE.isLoggedIn
    renderApp()
}

const addItem = async () => {
    if (!APP_STATE.isLoggedIn) return

    const name = document.getElementById('item-name').value.trim()
    const category = document.getElementById('item-category').value.trim()
    const quantity = parseInt(document.getElementById('item-quantity').value, 10)

    if (!name || !category || isNaN(quantity) || quantity < 0) {
        alert('Por favor, complete todos los campos correctamente')
        return
    }

    const newItem = {
        id: Date.now(),
        name,
        category,
        quantity,
        dateAdded: new Date().toLocaleDateString('es-DO')
    }

    APP_STATE.inventory.unshift(newItem)

    const saveSuccess = await saveData(APP_STATE.inventory)
    if (saveSuccess) {
        document.getElementById('add-item-form').reset()
        renderInventory()
    } else {
        alert('Error al guardar el artículo')
        APP_STATE.inventory.shift()
    }
}

const removeItem = async (id) => {
    if (!APP_STATE.isLoggedIn) return

    const originalLength = APP_STATE.inventory.length
    APP_STATE.inventory = APP_STATE.inventory.filter(item => item.id !== id)

    const saveSuccess = await saveData(APP_STATE.inventory)
    if (saveSuccess) {
        renderInventory()
    } else {
        alert('Error al eliminar el artículo')
    }
}

const filterInventory = (query) => {
    const lowerQuery = query.toLowerCase()
    return APP_STATE.inventory.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery) ||
        String(item.quantity).includes(lowerQuery)
    )
}

const handleFilterChange = (event) => {
    renderInventory(filterInventory(event.target.value))
}

const renderInventory = (inventoryList = APP_STATE.inventory) => {
    ELEMENTS.inventoryBody.innerHTML = ''

    if (inventoryList.length === 0) {
        const row = ELEMENTS.inventoryBody.insertRow()
        row.innerHTML = `<td colspan="5" style="text-align: center; color: #6b7280; padding: 2rem;">No hay artículos en el inventario.</td>`
        return
    }

    inventoryList.forEach(item => {
        const row = ELEMENTS.inventoryBody.insertRow()
        const quantityClass = item.quantity < 5 ? 'quantity-low' : 'quantity-ok'
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td class="${quantityClass}">${item.quantity}</td>
            <td>${item.dateAdded}</td>
            <td><button type="button" class="action-btn" data-id="${item.id}">Eliminar</button></td>
        `
    })

    ELEMENTS.inventoryBody.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', () => removeItem(parseInt(button.dataset.id, 10)))
    })
}

const renderApp = () => {
    ELEMENTS.app.innerHTML = ''
    const mainContainer = document.createElement('div')
    mainContainer.className = 'main-container'

    const header = document.createElement('div')
    header.className = 'header'
    header.innerHTML = '<h1>Perla Inventory App</h1>'

    ELEMENTS.authToggle = document.createElement('button')
    ELEMENTS.authToggle.className = `auth-toggle ${APP_STATE.isLoggedIn ? 'logged-in' : 'logged-out'}`
    ELEMENTS.authToggle.textContent = APP_STATE.isLoggedIn ? 'Cerrar Sesión (Admin)' : 'Iniciar Sesión (Mock)'
    ELEMENTS.authToggle.addEventListener('click', toggleAuth)
    header.appendChild(ELEMENTS.authToggle)
    mainContainer.appendChild(header)

    const contentSection = document.createElement('div')
    contentSection.className = 'content-section'

    contentSection.appendChild(createFormUI())
    contentSection.appendChild(createInventoryUI())

    mainContainer.appendChild(contentSection)
    ELEMENTS.app.appendChild(mainContainer)

    if (!APP_STATE.isLoggedIn) {
        ELEMENTS.inventoryContainer.innerHTML = '<div class="not-logged-in">Inicie sesión para ver y gestionar el inventario.</div>'
    } else {
        renderInventory()
    }
}

const createFormUI = () => {
    const formCard = document.createElement('div')
    formCard.className = 'card'
    formCard.innerHTML = `
        <h2>${APP_STATE.isLoggedIn ? 'Agregar Nuevo Artículo' : 'Acceso Restringido'}</h2>
        <form id="add-item-form">
            <div>
                <label for="item-name">Nombre del Artículo</label>
                <input type="text" id="item-name" required placeholder="Ej: Laptop Gamer" ${!APP_STATE.isLoggedIn ? 'disabled' : ''}>
            </div>
            <div>
                <label for="item-category">Categoría</label>
                <select id="item-category" required ${!APP_STATE.isLoggedIn ? 'disabled' : ''}>
                    <option value="">Seleccione...</option>
                    <option value="Electrónica">Electrónica</option>
                    <option value="Ropa">Ropa</option>
                    <option value="Alimentos">Alimentos</option>
                    <option value="Otros">Otros</option>
                </select>
            </div>
            <div>
                <label for="item-quantity">Cantidad</label>
                <input type="number" id="item-quantity" required min="0" placeholder="Ej: 15" ${!APP_STATE.isLoggedIn ? 'disabled' : ''}>
            </div>
            <button type="button" id="add-item-btn" ${!APP_STATE.isLoggedIn ? 'disabled' : ''}>Añadir al Inventario</button>
        </form>
    `
    formCard.querySelector('#add-item-btn').addEventListener('click', addItem)
    return formCard
}

const createInventoryUI = () => {
    const inventoryCard = document.createElement('div')
    inventoryCard.className = 'card'
    inventoryCard.innerHTML = `
        <h2>Lista de Inventario y Filtros</h2>
        <div>
            <label for="inventory-filter">Filtrar por Nombre/Categoría/Cantidad</label>
            <input type="text" id="inventory-filter" placeholder="Escriba aquí para buscar...">
        </div>
    `
    ELEMENTS.inventoryContainer = document.createElement('div')

    const table = document.createElement('table')
    table.className = 'inventory-table'
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Fecha Ingreso</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody id="inventory-body"></tbody>
    `
    ELEMENTS.inventoryBody = table.querySelector('#inventory-body')
    ELEMENTS.inventoryContainer.appendChild(table)
    inventoryCard.appendChild(ELEMENTS.inventoryContainer)

    ELEMENTS.filterInput = inventoryCard.querySelector('#inventory-filter')
    ELEMENTS.filterInput.addEventListener('input', handleFilterChange)

    return inventoryCard
}

const initApp = async () => {
    APP_STATE.inventory = await fetchData()
    APP_STATE.isLoggedIn = false
    renderApp()
}

window.onload = initApp