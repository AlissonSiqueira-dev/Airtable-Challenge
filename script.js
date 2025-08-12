document.addEventListener('DOMContentLoaded', function() {
    // Dados de exemplo
    const sampleItems = [
        { id: 1, name: "Event A", startDate: "2025-02-01", endDate: "2025-02-10" },
        { id: 2, name: "Event B", startDate: "2025-02-05", endDate: "2025-02-15" },
        { id: 3, name: "Event C", startDate: "2025-02-12", endDate: "2025-02-20" },
        { id: 4, name: "Event D", startDate: "2025-02-03", endDate: "2025-02-08" },
        { id: 5, name: "Event E", startDate: "2025-02-18", endDate: "2025-02-25" },
        { id: 6, name: "Event F", startDate: "2025-02-01", endDate: "2025-02-28" }
    ];

    const timeline = document.getElementById('timeline');
    const timeAxis = document.getElementById('timeAxis');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');

    let zoomLevel = 1;
    let minDate = new Date('2025-01-01');
    let maxDate = new Date('2025-03-01');
    let timelineItems = [...sampleItems];
    let draggedItem = null;
    let dragStartX = 0;
    let originalLeft = 0;

    // Inicializar a linha do tempo
    function initTimeline() {
        renderTimeAxis();
        renderTimelineItems();
    }

    // Renderizar eixo do tempo
    function renderTimeAxis() {
        timeAxis.innerHTML = '';
        
        const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
        const segmentDays = Math.ceil(totalDays / 10);
        
        for (let i = 0; i < 10; i++) {
            const segmentDate = new Date(minDate);
            segmentDate.setDate(segmentDate.getDate() + i * segmentDays);
            
            const segment = document.createElement('div');
            segment.className = 'time-segment';
            segment.textContent = formatDate(segmentDate);
            segment.style.flex = segmentDays;
            
            timeAxis.appendChild(segment);
        }
    }

    // Atribuir faixas (lanes) aos itens
    function assignLanes(items) {
        // Ordenar por data de início
        const sortedItems = [...items].sort((a, b) => 
            new Date(a.startDate) - new Date(b.startDate)
        );
        
        const lanes = [];
        
        sortedItems.forEach(item => {
            let lane = 0;
            while (lanes[lane] && new Date(lanes[lane].endDate) > new Date(item.startDate)) {
                lane++;
            }
            
            if (!lanes[lane]) lanes[lane] = [];
            lanes[lane].push(item);
            item.lane = lane;
        });
        
        return sortedItems;
    }

    // Renderizar itens na linha do tempo
    function renderTimelineItems() {
        // Limpar itens existentes
        document.querySelectorAll('.timeline-item').forEach(el => el.remove());
        
        // Atribuir faixas
        const itemsWithLanes = assignLanes(timelineItems);
        
        // Calcular fator de escala para datas
        const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
        const pxPerDay = (timeline.offsetWidth * zoomLevel) / totalDays;
        
        // Adicionar cada item à linha do tempo
        itemsWithLanes.forEach(item => {
            const startDate = new Date(item.startDate);
            const endDate = new Date(item.endDate);
            
            const daysFromStart = (startDate - minDate) / (1000 * 60 * 60 * 24);
            const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
            
            const left = daysFromStart * pxPerDay;
            const width = Math.max(durationDays * pxPerDay, 30); // Largura mínima
            
            const itemElement = document.createElement('div');
            itemElement.className = 'timeline-item';
            itemElement.textContent = item.name;
            itemElement.dataset.id = item.id;
            
            itemElement.style.left = `${left}px`;
            itemElement.style.width = `${width}px`;
            itemElement.style.top = `${60 + item.lane * 40}px`;
            
            // Eventos para edição
            itemElement.addEventListener('dblclick', () => editItemName(itemElement, item));
            
            // Eventos para drag and drop
            itemElement.addEventListener('mousedown', startDrag);
            
            timeline.appendChild(itemElement);
        });
    }

    // Formatar data para exibição
    function formatDate(date) {
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }

    // Editar nome do item
    function editItemName(element, item) {
        const input = document.createElement('input');
        input.value = item.name;
        
        element.innerHTML = '';
        element.appendChild(input);
        element.classList.add('editing');
        
        input.focus();
        
        function saveEdit() {
            const newName = input.value.trim();
            if (newName) {
                item.name = newName;
                element.classList.remove('editing');
                element.textContent = newName;
            }
        }
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveEdit();
        });
    }

    // Controles de zoom
    zoomInBtn.addEventListener('click', () => {
        zoomLevel *= 1.2;
        renderTimelineItems();
    });
    
    zoomOutBtn.addEventListener('click', () => {
        zoomLevel /= 1.2;
        if (zoomLevel < 0.5) zoomLevel = 0.5;
        renderTimelineItems();
    });

    // Drag and Drop
    function startDrag(e) {
        if (e.button !== 0) return; // Apenas botão esquerdo
        if (e.target.tagName === 'INPUT') return; // Não arrastar durante edição
        
        draggedItem = e.currentTarget;
        dragStartX = e.clientX;
        originalLeft = parseFloat(draggedItem.style.left);
        
        document.addEventListener('mousemove', dragItem);
        document.addEventListener('mouseup', stopDrag);
        
        e.preventDefault();
    }
    
    function dragItem(e) {
        if (!draggedItem) return;
        
        const dx = e.clientX - dragStartX;
        const newLeft = originalLeft + dx;
        
        // Limitar movimento aos limites da linha do tempo
        const minLeft = 0;
        const maxLeft = timeline.offsetWidth - draggedItem.offsetWidth;
        
        if (newLeft >= minLeft && newLeft <= maxLeft) {
            draggedItem.style.left = `${newLeft}px`;
        }
    }
    
    function stopDrag() {
        if (!draggedItem) return;
        
        // Atualizar datas baseado na nova posição
        const itemId = parseInt(draggedItem.dataset.id);
        const item = timelineItems.find(item => item.id === itemId);
        
        if (item) {
            const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
            const pxPerDay = (timeline.offsetWidth * zoomLevel) / totalDays;
            
            const newStartDays = parseFloat(draggedItem.style.left) / pxPerDay;
            const durationDays = (new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24);
            
            const newStartDate = new Date(minDate);
            newStartDate.setDate(newStartDate.getDate() + newStartDays);
            
            const newEndDate = new Date(newStartDate);
            newEndDate.setDate(newEndDate.getDate() + durationDays);
            
            item.startDate = formatDateForStorage(newStartDate);
            item.endDate = formatDateForStorage(newEndDate);
        }
        
        document.removeEventListener('mousemove', dragItem);
        document.removeEventListener('mouseup', stopDrag);
        draggedItem = null;
    }
    
    function formatDateForStorage(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Inicializar
    initTimeline();
});