// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAAy7mhA7YqtxE0Sc-VVk211Os19eTvIvQ",
    authDomain: "lista-de-tarefas-91419.firebaseapp.com",
    projectId: "lista-de-tarefas-91419",
    storageBucket: "lista-de-tarefas-91419.firebasestorage.app",
    messagingSenderId: "516873270421",
    appId: "1:516873270421:web:30c822c07d57eb67c6179c",
    measurementId: "G-JQ9W29D5MZ"
  };

// Inicialize o Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let pontos = parseInt(localStorage.getItem('pontos')) || 0;
let nivel = parseInt(localStorage.getItem('nivel')) || 1;
const pontosParaProximoNivel = 100;

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
});

function salvarDados() {
    const listas = [];
    document.querySelectorAll('.lista').forEach(lista => {
        const tarefas = [];
        lista.querySelectorAll('.tarefa').forEach(tarefa => {
            tarefas.push({
                texto: tarefa.querySelector('span').textContent,
                prioridade: tarefa.querySelector('input[type="checkbox"]').getAttribute('data-prioridade'),
                completa: tarefa.classList.contains('completa'),
            });
        });
        
        listas.push({
            titulo: lista.querySelector('.lista-titulo').textContent,
            tarefas: tarefas
        });
    });

    // Salvar no Firestore
    db.collection('listas').doc('usuario1').set({ listas })
        .then(() => {
            console.log('Dados salvos com sucesso!');
        })
        .catch((error) => {
            console.error('Erro ao salvar dados: ', error);
        });

    localStorage.setItem('pontos', pontos);
    localStorage.setItem('nivel', nivel);
}

function carregarDados() {
    db.collection('listas').doc('usuario1').get()
        .then((doc) => {
            if (doc.exists) {
                const listasData = doc.data().listas;
                const listasContainer = document.getElementById('listas-container');
                listasContainer.innerHTML = '';

                listasData.forEach(listaData => {
                    const novaLista = criarNovaListaElement(listaData.titulo);
                    listasContainer.appendChild(novaLista);

                    listaData.tarefas.forEach(tarefa => {
                        adicionarTarefaExistente(novaLista, tarefa);
                    });
                });

                document.getElementById('pontosTotal').textContent = pontos;
                document.getElementById('nivelAtual').textContent = nivel;
                const progresso = (pontos % pontosParaProximoNivel) / pontosParaProximoNivel * 100;
                document.getElementById('progressoBarra').style.width = progresso + '%';
            } else {
                console.log('Nenhum dado encontrado!');
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar dados: ', error);
        });
}

function criarNovaListaElement(titulo) {
    const novaLista = document.createElement('div');
    novaLista.className = 'lista';
    novaLista.innerHTML = `
        <div class="lista-header">
            <h2 class="lista-titulo">${titulo}</h2>
            <button class="apagar-concluidas" onclick="apagarConcluidas(this)">Limpar Concluídas</button>
            <button class="apagar-lista" onclick="apagarLista(this)">✕</button>
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
    return novaLista;
}

function adicionarTarefaExistente(lista, tarefaData) {
    const listaTarefas = lista.querySelector('.lista-tarefas');
    const novaTarefa = document.createElement('div');
    novaTarefa.className = 'tarefa';
    if (tarefaData.completa) novaTarefa.classList.add('completa');
    novaTarefa.draggable = true;
    
    novaTarefa.innerHTML = `
        <input type="checkbox" onchange="concluirTarefa(this)" data-prioridade="${tarefaData.prioridade}" ${tarefaData.completa ? 'checked' : ''}>
        <span>${tarefaData.texto}</span>
        <button class="excluir" onclick="excluirTarefa(this)">✕</button>
    `;
    
    listaTarefas.appendChild(novaTarefa);
    adicionarEventosDragDrop(novaTarefa);
}

function criarNovaLista() {
    const titulo = prompt('Nome da lista:');
    if (titulo) {
        const listasContainer = document.getElementById('listas-container');
        const novaLista = criarNovaListaElement(titulo);
        listasContainer.appendChild(novaLista);
        salvarDados();
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
        salvarDados();
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
    salvarDados();
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
            mostrarNotificacao(`Nível ${novoNivel} alcançado! 🎉`, 'nivel');
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
    salvarDados();
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const listaTarefas = e.target.closest('.lista-tarefas');
        if (listaTarefas) {
            const tarefa = document.querySelector('.arrastando');
            listaTarefas.appendChild(tarefa);
            salvarDados();
        }
    });
});

const style = document.createElement('style');
style.textContent = `
    .lista {
        transition: opacity 0.2s, transform 0.2s;
    }
    
    .fade-out {
        opacity: 0;
        transform: scale(0.95);
    }
`;
document.head.appendChild(style);

function apagarLista(botao) {
    if (confirm('Tem certeza que deseja apagar esta lista e todas as suas tarefas?')) {
        const lista = botao.closest('.lista');
        lista.classList.add('fade-out');
        setTimeout(() => {
            lista.remove();
            salvarDados();
        }, 200);
    }
}

function enviarComEnter(event, input) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const botao = input.nextElementSibling;
        adicionarTarefa(botao);
    }
}

function apagarConcluidas(botao) {
    const lista = botao.closest('.lista');
    const tarefasConcluidas = lista.querySelectorAll('.tarefa.completa');
    
    if (tarefasConcluidas.length === 0) {
        mostrarNotificacao('Não há tarefas concluídas para remover', 'erro');
        return;
    }

    if (confirm(`Deseja apagar ${tarefasConcluidas.length} tarefa(s) concluída(s)?`)) {
        tarefasConcluidas.forEach(tarefa => {
            tarefa.classList.add('fade-out');
            setTimeout(() => {
                tarefa.remove();
            }, 200);
        });
        mostrarNotificacao(`${tarefasConcluidas.length} tarefa(s) removida(s)`, 'sucesso');
    }
    setTimeout(() => {
        salvarDados();
    }, 250);
}
