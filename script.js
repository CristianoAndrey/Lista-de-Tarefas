let pontos = parseInt(localStorage.getItem('pontos')) || 0;
let nivel = parseInt(localStorage.getItem('nivel')) || 1;
const pontosParaProximoNivel = 100;

function salvarEstado() {
    localStorage.setItem('pontos', pontos);
    localStorage.setItem('nivel', nivel);
    
    const listasContainer = document.getElementById('listas-container');
    const listas = Array.from(listasContainer.children).map(lista => {
        const titulo = lista.querySelector('.lista-titulo').textContent;
        const tarefas = Array.from(lista.querySelectorAll('.tarefa')).map(tarefa => ({
            texto: tarefa.querySelector('span').textContent,
            prioridade: tarefa.querySelector('input[type="checkbox"]').getAttribute('data-prioridade'),
            completa: tarefa.classList.contains('completa')
        }));
        return { titulo, tarefas };
    });
    
    localStorage.setItem('listas', JSON.stringify(listas));
}

function carregarEstado() {
    const listasContainer = document.getElementById('listas-container');
    const listaSalva = localStorage.getItem('listas');
    
    if (listaSalva) {
        const listas = JSON.parse(listaSalva);
        listas.forEach(lista => {
            const novaLista = document.createElement('div');
            novaLista.className = 'lista';
            novaLista.innerHTML = `
                <div class="lista-header">
                    <h2 class="lista-titulo">${lista.titulo}</h2>
                </div>
                <div class="lista-tarefas">
                    <div class="input-grupo">
                        <select class="prioridade-select">
                            <option value="baixa">Prioridade Baixa (1 ponto)</option>
                            <option value="media">Prioridade Média (3 pontos)</option>
                            <option value="alta">Prioridade Alta (5 pontos)</option>
                        </select>
                        <input type="text" class="nova-tarefa" placeholder="Adicionar um cartão" onkeypress="enviarComEnter(event, this)">
                        <button onclick="adicionarTarefa(this)">Adicionar</button>
                    </div>
                </div>
            `;
            listasContainer.appendChild(novaLista);

            const listaTarefas = novaLista.querySelector('.lista-tarefas');
            lista.tarefas.forEach(tarefa => {
                const novaTarefa = document.createElement('div');
                novaTarefa.className = 'tarefa';
                novaTarefa.draggable = true;
                novaTarefa.classList.add(`prioridade-${tarefa.prioridade}`);
                if (tarefa.completa) {
                    novaTarefa.classList.add('completa', 'tarefa-completada');
                }
                
                novaTarefa.innerHTML = `
                    <input type="checkbox" onchange="concluirTarefa(this)" data-prioridade="${tarefa.prioridade}" ${tarefa.completa ? 'checked' : ''}>
                    <span>${tarefa.texto}</span>
                    <button class="excluir" onclick="excluirTarefa(this)">✕</button>
                `;
                
                listaTarefas.appendChild(novaTarefa);
                adicionarEventosDragDrop(novaTarefa);
            });
        });
    }

    document.getElementById('pontosTotal').textContent = pontos;
    document.getElementById('nivelAtual').textContent = nivel;
    const progresso = (pontos % pontosParaProximoNivel) / pontosParaProximoNivel * 100;
    document.getElementById('progressoBarra').style.width = progresso + '%';
}

function criarNovaLista() {
    const titulo = prompt('Nome da lista:');
    if (titulo) {
        const listasContainer = document.getElementById('listas-container');
        const novaLista = document.createElement('div');
        novaLista.className = 'lista';
        novaLista.innerHTML = `
            <div class="lista-header">
                <h2 class="lista-titulo">${titulo}</h2>
            </div>
            <div class="lista-tarefas">
                <div class="input-grupo">
                    <select class="prioridade-select">
                        <option value="baixa">Prioridade Baixa (1 ponto)</option>
                        <option value="media">Prioridade Média (3 pontos)</option>
                        <option value="alta">Prioridade Alta (5 pontos)</option>
                    </select>
                    <input type="text" class="nova-tarefa" placeholder="Adicionar um cartão" onkeypress="enviarComEnter(event, this)">
                    <button onclick="adicionarTarefa(this)">Adicionar</button>
                </div>
            </div>
        `;
        listasContainer.appendChild(novaLista);
        salvarEstado();
    }
}

function enviarComEnter(event, input) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const botao = input.nextElementSibling;
        adicionarTarefa(botao);
    }
}

function adicionarTarefa(botao) {
    const lista = botao.closest('.lista');
    const input = lista.querySelector('.nova-tarefa');
    const prioridadeSelect = lista.querySelector('.prioridade-select');
    const texto = input.value.trim();
    
    if (texto !== '') {
        const listaTarefas = lista.querySelector('.lista-tarefas');
        const novaTarefa = document.createElement('div');
        novaTarefa.className = 'tarefa';
        novaTarefa.draggable = true;
        
        const prioridade = prioridadeSelect.value;
        novaTarefa.classList.add(`prioridade-${prioridade}`);
        
        novaTarefa.innerHTML = `
            <input type="checkbox" onchange="concluirTarefa(this)" data-prioridade="${prioridade}">
            <span>${texto}</span>
            <button class="excluir" onclick="excluirTarefa(this)">✕</button>
        `;
        
        listaTarefas.appendChild(novaTarefa);
        input.value = '';
        adicionarEventosDragDrop(novaTarefa);
        salvarEstado();
    }
}

function concluirTarefa(checkbox) {
    const tarefa = checkbox.closest('.tarefa');
    const prioridade = checkbox.getAttribute('data-prioridade');
    const pontosPorPrioridade = {
        'baixa': 1,
        'media': 3,
        'alta': 5
    };
    const pontosGanhos = pontosPorPrioridade[prioridade];
    
    if (checkbox.checked) {
        tarefa.classList.add('completa', 'tarefa-completada');
        atualizarPontos(pontosGanhos);
        mostrarNotificacao(`+${pontosGanhos} pontos!`, 'sucesso');
    } else {
        tarefa.classList.remove('completa');
        atualizarPontos(-pontosGanhos);
        mostrarNotificacao(`-${pontosGanhos} pontos!`, 'erro');
    }
    salvarEstado();
}

function atualizarPontos(pontosGanhos) {
    pontos += pontosGanhos;
    pontos = Math.max(0, pontos);
    
    document.getElementById('pontosTotal').textContent = pontos;
    
    const novoNivel = Math.floor(pontos / pontosParaProximoNivel) + 1;
    if (novoNivel !== nivel) {
        nivel = novoNivel;
        document.getElementById('nivelAtual').textContent = nivel;
        if (pontosGanhos > 0) {
            mostrarNotificacao(`Nível ${nivel} alcançado! 🎉`, 'nivel');
        }
    }
    
    const progresso = (pontos % pontosParaProximoNivel) / pontosParaProximoNivel * 100;
    document.getElementById('progressoBarra').style.width = progresso + '%';
}

function mostrarNotificacao(texto, tipo) {
    const notificacao = document.createElement('div');
    let cor;
    
    switch(tipo) {
        case 'sucesso':
            cor = '#2ed573';
            break;
        case 'erro':
            cor = '#ff4757';
            break;
        case 'nivel':
            cor = '#ffa502';
            break;
        default:
            cor = '#2ed573';
    }

    notificacao.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${cor};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2s forwards;
        z-index: 1000;
        font-weight: bold;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    notificacao.textContent = texto;
    document.body.appendChild(notificacao);

    setTimeout(() => {
        notificacao.remove();
    }, 2300);
}

function adicionarEventosDragDrop(elemento) {
    elemento.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', '');
        elemento.classList.add('arrastando');
    });

    elemento.addEventListener('dragend', () => {
        elemento.classList.remove('arrastando');
    });
}

function excluirTarefa(botao) {
    const tarefa = botao.closest('.tarefa');
    tarefa.remove();
    salvarEstado();
}

document.addEventListener('DOMContentLoaded', () => {
    carregarEstado();
    
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const listaTarefas = e.target.closest('.lista-tarefas');
        if (listaTarefas) {
            const tarefa = document.querySelector('.arrastando');
            listaTarefas.appendChild(tarefa);
            salvarEstado();
        }
    });
});
