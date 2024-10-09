import { HermesClient } from "@pythnetwork/hermes-client";
import {
  encodeAbiParameters,
  encodeFunctionData,
  maxUint256,
  parseAbi,
  parseAbiParameters,
  parseEther,
} from "viem";

async function main() {
  const ethFeed =
    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
  const hermes = new HermesClient("https://hermes.pyth.network");
  const { binary } = await hermes.getLatestPriceUpdates([ethFeed]); // eth/usd price feed
  const updateData: `0x${string}`[] = [`0x${binary.data[0]}`];
  const encodedData = encodeAbiParameters(
    parseAbiParameters("uint8 a, uint64 b, bytes32[] c, bytes[] d"),
    [1, 60n, [ethFeed], updateData]
  );

  const accountId = 170141183460469231731687303715884105770n;

  const userOp = {
    sender: "0x25C126A49e2Aed4EF393c37e8d2deFf173A7894a",
    to: "0xd05B52EE1ECbAf2e4Ad3a57D97ed35d4f7C2fbF6",
    value: 5n,
    data: encodeFunctionData({
      abi: parseAbi([
        "function long(uint128 accountId, bool updateOracle, uint8 weiToSend, bytes oracleData, uint128 marketId, uint256 size, uint256 acceptablePrice, bytes vipUpgradeData)",
      ]),
      functionName: "long",
      args: [
        accountId,
        true,
        5,
        encodedData,
        100n,
        parseEther("1"),
        maxUint256,
        "0x",
      ],
    }),
  };

  console.log({ userOp });
}

main();
