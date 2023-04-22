const { Alchemy, Network } = require('alchemy-sdk');
const Chart = require('chart.js/auto');

function main() {
  const alchemyKey = new URLSearchParams(window.location.search).get('alchemyKey');
  if (!alchemyKey) {
    alert('Please, specify alchemyKey in URL params');
    return;
  }

  const settings = {
    apiKey: alchemyKey,
    network: Network.ETH_MAINNET,
  };

  window.alchemy = new Alchemy(settings);

  initializeChartState();
  window.alchemy.ws.on('block', updateCharts);

  drawCharts();
}

main();

function initializeChartState() {
  window.charts = [
    {
      // LINK token address
      address: '0x514910771af9ca656af840dff83e8264ecf986ca',
      // NOTE: this is the Transfer event signature
      topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
      chart: null
    },
    {
      // LINK token address
      address: '0x514910771af9ca656af840dff83e8264ecf986ca',
      chart: null
    },
  ]
}

async function transfersForBlockNumbers(blockNumbers) {
  const { address, topics } = window.charts[0];

  const transfers = await Promise.all(
    blockNumbers.map(async (blockNumber) => [
      blockNumber,
      await window.alchemy.core.getLogs({
        fromBlock: blockNumber,
        toBlock: blockNumber,
        topics: window.charts[0].topics
      })
    ])
  );

  return transfers.reduce((result, blockTransfers) => {
    result[blockTransfers[0]] = blockTransfers[1].length;
    return result;
  }, {});
}

async function basefeesForBlockNumbers(blockNumbers) {
  const baseFees = await Promise.all(
    blockNumbers.map(async (blockNumber) => [
      blockNumber,
      await window.alchemy.core.getBlock(blockNumber)
    ])
  );

  return baseFees.reduce((result, blockData) => {
    result[blockData[0]] = blockData[1].baseFeePerGas.toString();

    return result;
  }, {});
};

function updateChartWithData(chartIdx, data) {
  Object.keys(data).forEach((blockNumber) => {
    window.charts[chartIdx].chart.data.labels.push(blockNumber);
    window.charts[chartIdx].chart.data.datasets.forEach(dataset => {
      dataset.data.push(data[blockNumber]);
    });
  });

  window.charts[chartIdx].chart.update();
}

function updateCharts(blockNumber) {
  updateFirstChart(blockNumber);
  updateSecondChart(blockNumber);
}

async function updateFirstChart(blockNumber) {
  const blockTransfers = await transfersForBlockNumbers([blockNumber])

  updateChartWithData(0, blockTransfers);
}

async function updateSecondChart(blockNumber) {
  const blockBaseFees = await basefeesForBlockNumbers([blockNumber]);

  updateChartWithData(1, blockBaseFees);
}


function initializeBarChart(chartIndex, canvas, label, labels, data) {
  window.charts[chartIndex].chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label, data, borderWidth: 1 }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

async function drawFirstChart() {
  const canvas = document.getElementById('erc20-transfers-chart');

  const blockNumber = await window.alchemy.core.getBlockNumber();

  const lookbackBlockNumbers = [...Array(10).keys()].map(i => i + blockNumber - 9);
  const blockTransfers = await transfersForBlockNumbers(lookbackBlockNumbers);

  initializeBarChart(
    0,
    canvas,
    'LINK token transfers',
    Object.keys(blockTransfers),
    Object.values(blockTransfers)
  );
}

async function drawSecondChart() {
  const canvas = document.getElementById('basefee-chart');

  const blockNumber = await window.alchemy.core.getBlockNumber();

  const lookbackBlockNumbers = [...Array(10).keys()].map(i => i + blockNumber - 9);
  const blockBaseFees = await basefeesForBlockNumbers(lookbackBlockNumbers);

  initializeBarChart(
    1,
    canvas,
    'BASEFEE',
    lookbackBlockNumbers,
    Object.values(blockBaseFees)
  );
}


function drawCharts() {
  drawFirstChart();
  drawSecondChart();
  // buildChart2();
  // buildChart3();
}

