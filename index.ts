import { HermesClient } from "@pythnetwork/hermes-client";
import {
  Chain,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  Hex,
  http,
  maxUint256,
  parseAbi,
  parseAbiParameters,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  const { ENTRYPOINT_ADDRESS_V07 } = await import("permissionless/utils");
  const { KERNEL_V3_1 } = await import("@zerodev/sdk/constants");
  const { createKernelAccount, createKernelAccountClient } = await import(
    "@zerodev/sdk"
  );
  const { signerToEcdsaValidator } = await import("@zerodev/ecdsa-validator");

  const pk =
    "0x82e935c4daf66e2d2da41c9d9a77d83b1a5510feb0c254d5390fc692fb1cf48e";
  const signer = privateKeyToAccount(pk as Hex);
  const TESTNET_RPC = "https://rpc.sepolia.polynomial.fi";
  const testnetClient = createPublicClient({
    transport: http(TESTNET_RPC),
  });
  const polynomialSepolia: Chain = {
    id: 80008,
    name: "Polynomial Chain",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: {
        http: [TESTNET_RPC],
      },
    },
    blockExplorers: {
      default: {
        name: "Polynomial Chain Blockscout",
        url: "https://explorer.sepolia.polynomial.fi/",
      },
    },
  };
  const ecdsaValidator = await signerToEcdsaValidator(testnetClient, {
    signer: signer,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    kernelVersion: KERNEL_V3_1,
  });
  const account: any = await createKernelAccount(testnetClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    kernelVersion: KERNEL_V3_1,
    index: 8008n,
  });
  const kernelClient = createKernelAccountClient({
    account,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain: polynomialSepolia,
    bundlerTransport: http(
      "https://polynomial-sepolia.g.alchemy.com/v2/zdYQhw3lruidSOtmtp_Ff-LutdAzm7Tg"
    ),
    middleware: {
      gasPrice: async () => {
        return {
          maxFeePerGas: 0n,
          maxPriorityFeePerGas: 0n,
        };
      },
    },
  });

  const ethFeed =
    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
  const hermes = new HermesClient("https://hermes.pyth.network");
  const { binary } = await hermes.getLatestPriceUpdates([ethFeed]); // eth/usd price feed
  const updateData: `0x${string}`[] = [`0x${binary.data[0]}`];
  const encodedData = encodeAbiParameters(
    parseAbiParameters("uint8 a, uint64 b, bytes32[] c, bytes[] d"),
    [1, 60n, [ethFeed], updateData]
  );

  const accountId = 3175937069n;
  const to = "0xd05B52EE1ECbAf2e4Ad3a57D97ed35d4f7C2fbF6";
  const sender = "0x44485caDb20D9a59aE1e407fA1679dE9c09D5Db9";

  const userOp_ = {
    to: to,
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
    callType: "delegatecall",
  };

  const userOp = await kernelClient.signUserOperation({
    account,
    userOperation: {
      callData: await account.encodeCallData(userOp_),
    },
  });

  console.log({ userOp });
}

main();
