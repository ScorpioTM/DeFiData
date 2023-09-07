// Import the modules
import { Contract, Interface, Result } from 'ethers';
import { createHash } from 'node:crypto';

// Import the types
import type { Signer, Provider } from 'ethers';

// Import the ABIs
import Multicall3ABI from '../abis/Multicall3.json';

export interface Call3 {
  abi: string[];
  target: string;
  allowFailure: boolean;
  callMethod: string;
  callData: string;
}

export interface Aggregate3Response {
  abi: string[];
  success: boolean;
  callMethod: string;
  returnData: string;
}

export class Multicall3 {
  private readonly _multicall3: Contract;

  private _contractCalls: {
    [callReference: string]: Call3;
  } = {};

  private _contractResponses: {
    [callReference: string]: Aggregate3Response;
  } = {};

  constructor(signerOrProvider: Signer | Provider, multicall3Address = '0xcA11bde05977b3631167028862bE2a173976CA11') {
    // Declare the multicall3 contract
    this._multicall3 = new Contract(multicall3Address, Multicall3ABI, signerOrProvider);
  }

  public addCall(
    contractABI: string[],
    contractAddress: string,
    callMethod: string,
    callParameters: unknown[],
    allowFailure = true,
    allowDuplicates = false
  ): string {
    return this._addCall(contractABI, contractAddress, callMethod, callParameters, allowFailure, allowDuplicates);
  }

  getCall(callReference: string): Result | undefined;
  getCall(
    contractABI: string[],
    contractAddress: string,
    callMethod: string,
    callParameters: unknown[]
  ): Result | undefined;

  public getCall(...args: unknown[]): Result | undefined {
    if (args.length === 4) {
      // Get the unique reference for this call
      const callReference: string = this._getCallReference(
        <string[]>args[0],
        <string>args[1],
        <string>args[2],
        <unknown[]>args[3]
      );

      return this._getCall(callReference);
    } else if (args.length === 1) {
      return this._getCall(<string>args[0]);
    } else throw new Error('Invalid arguments error while adding call!');
  }

  public async runCalls(blockTag?: number | string | bigint): Promise<void> {
    // Format the pending calls
    const contractCalls: Call3[] = Object.keys(this._contractCalls).map(
      (callReference: string) => this._contractCalls[callReference]
    );

    // Execute the pending calls
    const response: Aggregate3Response[] = await this._multicall3.aggregate3.staticCall(contractCalls, {
      blockTag: blockTag === undefined ? 'latest' : blockTag
    });

    // Erase the previous responses
    this._contractResponses = {};

    // Save the new responses
    Object.keys(this._contractCalls).forEach((callReference: string, i: number) => {
      this._contractResponses[callReference] = {
        abi: this._contractCalls[callReference].abi,
        success: response[i].success,
        callMethod: this._contractCalls[callReference].callMethod,
        returnData: response[i].returnData
      };
    });

    // Erase the pending calls
    this._contractCalls = {};
  }

  private _addCall(
    contractABI: string[],
    contractAddress: string,
    callMethod: string,
    callParameters: unknown[],
    allowFailure: boolean,
    allowDuplicates: boolean
  ): string {
    // Get the unique reference for this call
    const callReference: string = this._getCallReference(contractABI, contractAddress, callMethod, callParameters);

    // Check for duplicates
    if (this._contractCalls[callReference] !== undefined) {
      if (allowDuplicates !== true) throw new Error('This contract call is already defined!');

      // Return the unique reference
      return callReference;
    }

    // Define the interface for this call
    const contractInterface = new Interface(contractABI);

    // Save this call
    this._contractCalls[callReference] = {
      abi: contractABI,
      target: contractAddress,
      allowFailure: allowFailure,
      callMethod: callMethod,
      callData: contractInterface.encodeFunctionData(callMethod, callParameters)
    };

    // Return the unique reference
    return callReference;
  }

  private _getCall(callReference: string): Result | undefined {
    if (!this._contractResponses[callReference].success) return undefined;
    if (this._contractResponses[callReference].returnData === '0x') return undefined;

    try {
      // Define the interface for this call
      const contractInterface = new Interface(this._contractResponses[callReference].abi);

      // Decode the responses
      return contractInterface.decodeFunctionResult(
        this._contractResponses[callReference].callMethod,
        this._contractResponses[callReference].returnData
      );
    } catch (error: unknown) {
      return undefined;
    }
  }

  private _getCallReference(
    contractABI: string[],
    contractAddress: string,
    callMethod: string,
    callParameters: unknown[]
  ): string {
    return createHash('sha256')
      .update(JSON.stringify([contractABI, contractAddress, callMethod, callParameters]))
      .digest('hex');
  }
}

export default Multicall3;
