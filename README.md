# Blockchain charts

Three charts displaying displaying on-chain metrics.

## Run the project

The project uses `browserify` to bundle the JavaScript and make it available for the front-end.

To start the project locally and re-run the bundling once code changes, navigate to the project directory and run the following commands:

```sh
npm install
npx watchify index.js -o bundle.js
```


Then visit [file:///path/to/project/blockchain-charts/index.html?alchemyKey=yourAlchemyKeyGoesHere](file:///path/to/project/blockchain-charts/index.html?alchemyKey=yourAlchemyKeyGoesHere) in your browser.

## Charts

### LINK token transfers

Chart displays the amount of transfers made per block for the LINK token on Ethereum Mainnet.
The chart is initialized with 10 block lookback data and then updates once a new block is released.

### BASEFEE chart

Chart displays the base fee of each block on Ethereum Mainnet.
The chart is initialized with 10 block lookback data and then updates once a new block is released.

### Gas Used vs Gas Limit chart

Chart displays the gas used vs gas limit as percentage for each block on Ethereum Mainnet.
The chart is initialized with 10 block lookback data and then updates once a new block is released.

## Conclusions

If you take a look at the `BASEFEE` and `Gas used vs gas limit` charts you might notice that once the ratio of the gas used vs gas limit goes over 50% the next block's base fee will be increased.

On the other hand if the ratio is under 50% the next block's base fee will be reduced.


