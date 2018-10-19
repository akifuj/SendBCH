import BITBOXSDK from "bitbox-sdk/lib/bitbox-sdk"
import { HDNode } from "bitbox-sdk/lib/HDNode"
import { AddressUtxoResult } from "bitbox-sdk/lib/Address"
import { ECPair } from "bitbox-sdk/lib/ECPair"

const BITBOX = new BITBOXSDK()
export default class Wallet {
    public mnemonic: string
    private _node?: HDNode
    private _key?: ECPair
    private _address?: string
    private get node(): HDNode {
      return this._node || (this._node = this.getNode())
    }
    private get key(): ECPair {
      return this._key || (this._key = this.getKey())
    }
    get address(): string {
      return this._address || (this._address = this.getAddress())
    }
    constructor(mnemonic?: string) {
      if (!mnemonic) {
        mnemonic = this.genMnemonic()
      }
      this.mnemonic = mnemonic
      localStorage.setItem("mnemonic", mnemonic)
    }
    public async getBalance(): Promise<number> {
      const utxos = await this.getUTXO()
      console.log(utxos)
      return utxos.map((utxo) => utxo.satoshis)
        .reduce((prev, cur) => prev + cur, 0)
    }
    public async send(addresses: string[], amount: number): Promise<string> {
      const utxos = await this.getUTXO()
      const utxo = utxos[0]
      const txBuilder = new BITBOX.TransactionBuilder()
      txBuilder.addInput(utxo.txid, utxo.vout)
      for (const address of addresses) {
        txBuilder.addOutput(address, 10000)
      }
      const bytes = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: 2}) * addresses.length
      const change = utxo.satoshis - amount * addresses.length - bytes
      txBuilder.addOutput(this.address, change)
      txBuilder.sign(0, this.key, undefined, txBuilder.hashTypes.SIGHASH_ALL, utxo.satoshis)
      const tx = txBuilder.build()
      const result = await BITBOX.RawTransactions.sendRawTransaction(tx.toHex())
      if (this.isTxHash(result)) {
        return result
      } else {
        return Promise.reject(result)
      }
    }
    private genMnemonic(): string {
      const randBytes = BITBOX.Crypto.randomBytes(32)
      return BITBOX.Mnemonic.fromEntropy(randBytes)
    }
    private getNode(): HDNode {
      const rootSeed = BITBOX.Mnemonic.toSeed(this.mnemonic)
      const masterKey = BITBOX.HDNode.fromSeed(rootSeed)
      const path = "m/44'/145'/0/0/0"
      return BITBOX.HDNode.derivePath(masterKey, path)
    }
    private getKey(): ECPair {
      return BITBOX.HDNode.toKeyPair(this.node)
    }
    private getAddress(): string {
      return BITBOX.HDNode.toCashAddress(this.node)
    }
    private async getUTXO(): Promise<AddressUtxoResult[]> {
        const utxos = await BITBOX.Address.utxo(this.address)
        return ([] as AddressUtxoResult[]).concat(...utxos)
    }
    private isTxHash(target: string): boolean {
      const re = /[0-9A-Ffa-f]{64}/g
      return re.test(target)
    }
}
