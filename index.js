const { Alchemy, Network } = require('alchemy-sdk');
const Chart = require('chart.js/auto');
const ethers = require('ethers');
const { utils, BigNumber } = ethers;

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
  const eventSignature = 'Transfer(address,address,uint256)';

  window.charts = [
    {
      // LINK token address
      address: '0x514910771af9ca656af840dff83e8264ecf986ca',
      // NOTE: this is the Transfer event signature
      eventSignature,
      eventInterface: new utils.Interface([`event ${eventSignature}`]),
      topics: [utils.id(eventSignature)],
      chart: null
    },
    { chart: null }
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

  const DECIMALS = BigNumber.from('10').pow(BigNumber.from(18));

  return transfers.reduce((result, blockTransfers) => {
    const logs = blockTransfers[1];

    result[blockTransfers[0]] = logs.reduce((volume, event) => {
      let { data } = event;
      if (data === '0x') {
        data = '0x0';
      }

      return volume.add(BigNumber.from(data));
    }, BigNumber.from(0)).div(DECIMALS).toString();

    return result;
  }, {});
}

async function blockDataForBlockNumbers(blockNumbers) {
  return await Promise.all(
    blockNumbers.map(async (blockNumber) => [
      blockNumber,
      await window.alchemy.core.getBlock(blockNumber)
    ])
  );
}

async function basefeesForBlockNumbers(blocksData) {
  return blocksData.reduce((result, blockData) => {
    result[blockData[0]] = blockData[1].baseFeePerGas.toString();

    return result;
  }, {});
};

async function gasRatioForBlockNumbers(blocksData) {
  return blocksData.reduce((result, blockData) => { const { gasUsed, gasLimit } = blockData[1];

    result[blockData[0]] = gasUsed.mul(100).div(gasLimit).toString();

    return result;
  }, {});
};

function updateChartWithData(chartIdx, datasetIdx, data) {
  const chartObject = window.charts[chartIdx];
  const { chart } = chartObject;

  Object.keys(data).forEach((blockNumber) => {
    chart.data.labels.push(blockNumber);
    chart.data.labels = chart.data.labels.splice(-10);

    const dataset = chart.data.datasets[datasetIdx];
    dataset.data.push(data[blockNumber]);
    dataset.data = dataset.data.splice(-10);
  });

  window.charts[chartIdx].chart.update();
}

async function updateCharts(blockNumber) {
  updateFirstChart(blockNumber);

  const blocksData = await blockDataForBlockNumbers([blockNumber]);

  updateSecondChart(blocksData);
}

async function updateFirstChart(blockNumber) {
  const blockTransfers = await transfersForBlockNumbers([blockNumber])

  updateChartWithData(0, 0, blockTransfers);
}

async function updateSecondChart(blocksData) {
  const blockBaseFees = await basefeesForBlockNumbers(blocksData);
  const blockGasRatio = await gasRatioForBlockNumbers(blocksData);

  updateChartWithData(1, 0, blockBaseFees);
  updateChartWithData(1, 1, blockGasRatio);
}

function initializeFirstChart(canvas, label, labels, data) {
  window.charts[0].chart = new Chart(canvas, {
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

function initializeSecondChart(canvas, lineLabels, labels, firstLineData, secondLineData) {
  window.charts[1].chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: lineLabels[0],
          data: Object.values(firstLineData),
          fill: false,
          cubicInterpolationMode: 'monotone',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: lineLabels[1],
          data: Object.values(secondLineData),
          fill: false,
          cubicInterpolationMode: 'monotone',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      stacked: false,
      scales: {
        y: {
          beginAtZero: false,
          type: 'linear',
          display: true,
          position: 'right',
        },
        y1: {
          beginAtZero: true,
          type: 'linear',
          display: true,
          position: 'left',
          min: 0,
          max: 100,
          grid: {
            // only want the grid lines for one axis to show up
            drawOnChartArea: false,
          },
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

  initializeFirstChart(
    canvas,
    'LINK token transfers',
    Object.keys(blockTransfers),
    Object.values(blockTransfers)
  );
}

async function drawSecondChart() {
  const canvas = document.getElementById('second-chart');

  const blockNumber = await window.alchemy.core.getBlockNumber();

  const lookbackBlockNumbers = [...Array(10).keys()].map(i => i + blockNumber - 9);

  const blocksData = await blockDataForBlockNumbers(lookbackBlockNumbers)
  const blockBaseFees = await basefeesForBlockNumbers(blocksData);
  const blockGasRatio = await gasRatioForBlockNumbers(blocksData);

  initializeSecondChart(
    canvas,
    ['BASEFEE', 'Gas used vs Gas limit (%)'],
    lookbackBlockNumbers,
    Object.values(blockBaseFees),
    Object.values(blockGasRatio)
  );
}

function drawCharts() {
  drawFirstChart();
  drawSecondChart();
}

