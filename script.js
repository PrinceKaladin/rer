// Telegram Web App initialization
const tg = window.Telegram.WebApp;
tg.expand();

// DOM Elements
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const assetsList = document.getElementById('assets-list');

// API configuration
const API_BASE_URL = 'http://127.0.0.1:5000/api';


// Cryptocurrency configuration
const cryptoList = [
  { 
    id: "tether-usdt-bep20", 
    symbol: "USDT",
    network: "BEP20",
    name: "Tether BEP20", 
    icon: "https://cryptologos.cc/logos/tether-usdt-logo.png"
  },
  { 
    id: "tether-usdt-erc20", 
    symbol: "USDT",
    network: "ERC20",
    name: "Tether ERC20", 
    icon: "https://cryptologos.cc/logos/tether-usdt-logo.png"
  },
  { 
    id: "tether-usdt-trc20", 
    symbol: "USDT",
    network: "TRC20",
    name: "Tether TRC20", 
    icon: "https://cryptologos.cc/logos/tether-usdt-logo.png"
  },
  { 
    id: "binancecoin", 
    symbol: "BNB",
    network: "BSC",
    name: "BNB", 
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png"
  },
  { 
    id: "ethereum", 
    symbol: "ETH",
    network: "ETH",
    name: "Ethereum", 
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
  },
  { 
    id: "bitcoin", 
    symbol: "BTC",
    network: "BTC",
    name: "Bitcoin", 
    icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.png"
  },
  { 
    id: "ripple", 
    symbol: "XRP",
    network: "XRP",
    name: "XRP", 
    icon: "https://cryptologos.cc/logos/xrp-xrp-logo.png"
  },
  { 
    id: "the-open-network", 
    symbol: "TON",
    network: "TON",
    name: "Toncoin", 
    icon: "https://cryptologos.cc/logos/toncoin-ton-logo.png"
  },
  { 
    id: "tron", 
    symbol: "TRX",
    network: "TRON",
    name: "TRON", 
    icon: "https://cryptologos.cc/logos/tron-trx-logo.png"
  }
];

// Networks configuration
const networks = {
  BSC: {
    name: "BSC",
    coins: ["BNB", "USDT"]
  },
  ETH: {
    name: "Ethereum",
    coins: ["ETH", "USDT"]
  },
  BTC: {
    name: "Bitcoin",
    coins: ["BTC"]
  },
  XRP: {
    name: "Ripple",
    coins: ["XRP"]
  },
  TON: {
    name: "TON",
    coins: ["TON", "USDT"]
  },
  TRON: {
    name: "TRON",
    coins: ["TRX", "USDT"]
  }
};

// API Functions
async function fetchWithAuth(endpoint, options = {}) {
  try {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tg.initData}`
      }
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Load user assets and update UI
async function loadUserAssets() {
  try {
    const response = await fetchWithAuth(`/user/${currentUserId}/assets`);
    const assets = await response.json();
    
    let totalBalance = 0;
    
    // Update each asset in the list
    document.querySelectorAll('.asset-item').forEach(item => {
      const assetSymbol = item.querySelector('.balance-amount').textContent.split(' ')[1];
      const asset = assets.find(a => a.symbol === assetSymbol);
      
      if (asset) {
        const crypto = cryptoList.find(c => c.symbol === asset.symbol);
        if (crypto) {
          const balanceAmount = item.querySelector('.balance-amount');
          const balanceValue = item.querySelector('.balance-value');
          const priceElement = item.querySelector('.asset-price');
          
          balanceAmount.textContent = `${asset.balance} ${asset.symbol}`;
          balanceValue.textContent = `$${(asset.balance * asset.price).toFixed(2)}`;
          priceElement.innerHTML = `$${asset.price.toFixed(2)} <span class="price-change ${asset.priceChange >= 0 ? 'positive' : 'negative'}">${asset.priceChange}%</span>`;
          
          totalBalance += asset.balance * asset.price;
        }
      }
    });
    
    // Update total balance
    document.querySelector('.balance-amount .amount').textContent = totalBalance.toFixed(2);
    
  } catch (error) {
    console.error('Error loading assets:', error);
    showError('Failed to load assets');
  }
}

// Generate deposit address
async function generateDepositAddress(network, crypto) {
  try {
    const response = await fetchWithAuth(`/user/${currentUserId}/deposit/address`, {
      method: 'POST',
      body: JSON.stringify({ network, crypto })
    });
    
    const { address } = await response.json();
    return address;
    
  } catch (error) {
    console.error('Error generating deposit address:', error);
    showError('Failed to generate deposit address');
    return null;
  }
}

// Submit withdrawal
async function submitWithdrawal(network, crypto, address, amount) {
  try {
    const response = await fetchWithAuth(`/user/${currentUserId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({
        network,
        crypto,
        toAddress: address,
        amount: parseFloat(amount)
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showSuccess('Withdrawal request submitted successfully');
      closeModal();
      loadUserAssets(); // Refresh balances
    } else {
      showError(result.message || 'Withdrawal failed');
    }
    
  } catch (error) {
    console.error('Error submitting withdrawal:', error);
    showError('Failed to submit withdrawal');
  }
}

// Function to update the assets list
function updateAssetsList() {
  assetsList.innerHTML = '';

  cryptoList.forEach(crypto => {
    const assetItem = document.createElement('div');
    assetItem.className = 'asset-item';
    
    const networkInfo = crypto.network ? ` ${crypto.network}` : '';
    
    assetItem.innerHTML = `
      <div class="asset-info">
        <img src="${crypto.icon}" alt="${crypto.name}" class="asset-icon">
        <div class="asset-details">
          <div class="asset-name">${crypto.name}${networkInfo}</div>
          <div class="asset-price">$0 <span class="price-change">0%</span></div>
        </div>
      </div>
      <div class="asset-balance">
        <div class="balance-amount">0 ${crypto.symbol}</div>
        <div class="balance-value">$0</div>
      </div>
    `;
    assetsList.appendChild(assetItem);
  });
}

// UI Functions
function openTopUp() {
  modalBody.innerHTML = `
    <div class="modal-header">
      <h2>Пополнить</h2>
      <button onclick="closeModal()" class="close-button">&times;</button>
    </div>
    <div class="networks-list">
      ${Object.entries(networks).map(([networkId, network]) => `
        <div class="network-section">
          <h3>${network.name}</h3>
          ${network.coins.map(coin => {
            const crypto = cryptoList.find(c => c.symbol === coin.split('-')[0] && (!coin.includes('-') || c.network === coin.split('-')[1]));
            if (!crypto) return '';
            return `
              <div class="crypto-option" onclick="displayDepositAddress('${networkId}', '${crypto.symbol}')">
                <img src="${crypto.icon}" alt="${crypto.name}">
                <span>${crypto.name}</span>
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
    </div>
  `;
  modal.style.display = "block";
}

async function displayDepositAddress(network, crypto) {
  modalBody.innerHTML = `
    <div class="modal-header">
      <h2>Генерация адреса...</h2>
      <button onclick="closeModal()" class="close-button">&times;</button>
    </div>
  `;
  
  try {
    const address = await generateDepositAddress(network, crypto);
    if (!address) {
      throw new Error('Failed to generate address');
    }
    
    modalBody.innerHTML = `
      <div class="modal-header">
        <h2>Адрес для пополнения</h2>
        <button onclick="closeModal()" class="close-button">&times;</button>
      </div>
      <div class="deposit-address">
        <div class="warning-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Отправляйте только ${crypto} (${network}). Отправка других токенов может привести к потере средств!</p>
        </div>
        <div class="address-box">
          <code>${address}</code>
          <button onclick="copyToClipboard('${address}')" class="copy-button">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="qr-code" id="qr-code"></div>
      </div>
    `;
    
    // Generate QR code
    new QRCode(document.getElementById("qr-code"), address);
    
  } catch (error) {
    showError('Failed to generate deposit address');
    closeModal();
  }
}

function openWithdraw() {
  modalBody.innerHTML = `
    <div class="modal-header">
      <h2>Вывести</h2>
      <button onclick="closeModal()" class="close-button">&times;</button>
    </div>
    <div class="networks-list">
      ${Object.entries(networks).map(([networkId, network]) => `
        <div class="network-section">
          <h3>${network.name}</h3>
          ${network.coins.map(coin => {
            const crypto = cryptoList.find(c => c.symbol === coin.split('-')[0] && (!coin.includes('-') || c.network === coin.split('-')[1]));
            if (!crypto) return '';
            return `
              <div class="crypto-option" onclick="showWithdrawForm('${networkId}', '${crypto.symbol}')">
                <img src="${crypto.icon}" alt="${crypto.name}">
                <span>${crypto.name}</span>
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
    </div>
  `;
  modal.style.display = "block";
}

async function showWithdrawForm(network, crypto) {
  try {
    // Get user's balance for the selected crypto
    const response = await fetchWithAuth(`/user/${currentUserId}/balance/${network}/${crypto}`);
    const { balance, price } = await response.json();
    
    modalBody.innerHTML = `
      <div class="modal-header">
        <h2>Вывод ${crypto}</h2>
        <button onclick="closeModal()" class="close-button">&times;</button>
      </div>
      <form onsubmit="handleWithdraw(event, '${network}', '${crypto}')" class="withdraw-form">
        <div class="balance-info">
          <span>Доступно: ${balance} ${crypto}</span>
          <span>≈ $${(balance * price).toFixed(2)}</span>
        </div>
        <div class="form-group">
          <label for="withdraw-address">Адрес ${crypto} (${network})</label>
          <input type="text" id="withdraw-address" required placeholder="Введите адрес получателя">
        </div>
        <div class="form-group">
          <label for="withdraw-amount">Сумма</label>
          <div class="amount-input">
            <input type="number" id="withdraw-amount" required step="any" min="0" max="${balance}" placeholder="0.00">
            <span class="max-button" onclick="setMaxAmount(${balance})">MAX</span>
          </div>
          <span class="usd-value" id="usd-value">≈ $0.00</span>
        </div>
        <button type="submit" class="submit-button">Вывести</button>
      </form>
    `;
    
    // Add event listener for amount input to update USD value
    const amountInput = document.getElementById('withdraw-amount');
    amountInput.addEventListener('input', () => {
      const usdValue = document.getElementById('usd-value');
      const amount = parseFloat(amountInput.value) || 0;
      usdValue.textContent = `≈ $${(amount * price).toFixed(2)}`;
    });
    
  } catch (error) {
    showError('Failed to get balance');
    closeModal();
  }
}

function setMaxAmount(balance) {
  const amountInput = document.getElementById('withdraw-amount');
  amountInput.value = balance;
  amountInput.dispatchEvent(new Event('input'));
}

async function handleWithdraw(event, network, crypto) {
  event.preventDefault();
  
  const address = document.getElementById('withdraw-address').value;
  const amount = document.getElementById('withdraw-amount').value;
  
  if (!address || !amount) {
    showError('Please fill in all fields');
    return;
  }
  
  try {
    await submitWithdrawal(network, crypto, address, amount);
  } catch (error) {
    showError(error.message);
  }
}

// Utility Functions
function showError(message) {
  const notification = document.createElement('div');
  notification.className = 'notification error';
  notification.innerHTML = `
    <i class="fas fa-exclamation-circle"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function showSuccess(message) {
  const notification = document.createElement('div');
  notification.className = 'notification success';
  notification.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function closeModal() {
  modal.style.display = "none";
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showSuccess('Адрес скопирован');
  }).catch(() => {
    showError('Не удалось скопировать адрес');
  });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  updateAssetsList();
  loadUserAssets();
  // Refresh assets every minute
  setInterval(loadUserAssets, 60000);
});

window.onclick = (event) => {
  if (event.target === modal) {
    closeModal();
  }
};

// Функции для модальных окон
function showDepositModal() {
  const modal = document.getElementById('depositModal');
  modal.style.display = 'block';
  
  // Обновляем информацию о выбранной монете
  updateSelectedCoin();
  
  // Получаем адрес для депозита
  getDepositAddress();
}

function showWithdrawModal() {
  const modal = document.getElementById('withdrawModal');
  modal.style.display = 'block';
  
  // Получаем баланс пользователя
  updateBalance();
}

// Обновление информации о выбранной монете
function updateSelectedCoin() {
  const coin = document.getElementById('depositCoin').value;
  document.getElementById('selectedCoin').textContent = coin;
  document.querySelectorAll('.selected-coin').forEach(el => {
    el.textContent = coin;
  });
}

// Получение адреса для депозита
async function getDepositAddress() {
  try {
    const coin = document.getElementById('depositCoin').value;
    const network = document.getElementById('depositNetwork').value;
    
    const response = await fetchWithAuth('/api/get-deposit-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coin: coin,
        network: network
      })
    });
    
    const data = await response.json();
    
    if (data.address) {
      document.getElementById('depositAddress').textContent = data.address;
      updateQRCode(data.address);
    }
  } catch (error) {
    console.error('Error getting deposit address:', error);
    showNotification('Ошибка при получении адреса', 'error');
  }
}

// Обновление баланса
async function updateBalance() {
  try {
    const coin = document.getElementById('withdrawCoin').value;
    const response = await fetchWithAuth('/api/get-balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coin: coin
      })
    });
    
    const data = await response.json();
    
    if (data.balance) {
      document.getElementById('availableBalance').textContent = data.balance;
    }
  } catch (error) {
    console.error('Error getting balance:', error);
    showNotification('Ошибка при получении баланса', 'error');
  }
}

// Копирование адреса
function copyAddress() {
  const address = document.getElementById('depositAddress').textContent;
  navigator.clipboard.writeText(address).then(() => {
    showNotification('Адрес скопирован', 'success');
  }).catch(() => {
    showNotification('Ошибка при копировании', 'error');
  });
}

// Установка максимальной суммы
function setMaxAmount() {
  const balance = document.getElementById('availableBalance').textContent;
  document.getElementById('withdrawAmount').value = balance;
  updateUsdValue();
}

// Обновление значения в USD
async function updateUsdValue() {
  const amount = document.getElementById('withdrawAmount').value;
  const coin = document.getElementById('withdrawCoin').value;
  
  try {
    const response = await fetchWithAuth('/api/get-usd-value', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        coin: coin
      })
    });
    
    const data = await response.json();
    
    if (data.usdValue) {
      document.getElementById('usdValue').textContent = data.usdValue.toFixed(2);
    }
  } catch (error) {
    console.error('Error getting USD value:', error);
  }
}

// Отправка формы вывода
async function submitWithdraw() {
  const coin = document.getElementById('withdrawCoin').value;
  const network = document.getElementById('withdrawNetwork').value;
  const address = document.getElementById('withdrawAddress').value;
  const amount = document.getElementById('withdrawAmount').value;
  
  if (!address || !amount) {
    showNotification('Заполните все поля', 'error');
    return;
  }
  
  try {
    const response = await fetchWithAuth('/api/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coin: coin,
        network: network,
        address: address,
        amount: amount
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Заявка на вывод создана', 'success');
      document.getElementById('withdrawModal').style.display = 'none';
    } else {
      showNotification(data.error || 'Ошибка при создании заявки', 'error');
    }
  } catch (error) {
    console.error('Error submitting withdrawal:', error);
    showNotification('Ошибка при отправке заявки', 'error');
  }
}

// Обработчики событий для селекторов
document.getElementById('depositCoin').addEventListener('change', () => {
  updateSelectedCoin();
  getDepositAddress();
});

document.getElementById('depositNetwork').addEventListener('change', getDepositAddress);

document.getElementById('withdrawCoin').addEventListener('change', () => {
  updateBalance();
  updateUsdValue();
});

// Закрытие модальных окон
document.querySelectorAll('.close-modal').forEach(button => {
  button.onclick = function() {
    this.closest('.modal').style.display = 'none';
  }
});

// Закрытие при клике вне модального окна
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
}

// Функция для показа уведомлений
function showNotification(message, type) {
  // Создаем элемент уведомления
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Добавляем на страницу
  document.body.appendChild(notification);
  
  // Удаляем через 3 секунды
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Функция для обновления QR кода
function updateQRCode(address) {
  const qrContainer = document.getElementById('qrCode');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: address,
      width: 128,
      height: 128
    });
  }
}
