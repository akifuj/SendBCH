import * as React from "react"
import "./App.css"
import Wallet from "./wallet"

let wallet: Wallet
const mnemonic = localStorage.getItem("mnemonic")
if (mnemonic) {
  wallet = new Wallet(mnemonic)
} else {
  wallet = new Wallet()
}

interface ISendState {
  addresses: string[]
  amount: string
  balance: number
  txid: string
}

class App extends React.Component<any, ISendState> {
  constructor(props: any) {
    super(props)
    this.state = {
      addresses: [],
      amount: "",
      balance: 0,
      txid: ""
    }
  }
  public async componentDidMount() {
    const balance = await wallet.getBalance()
    console.log(balance)
    this.setState({balance})
  }
  public changeAmount = (e: any) => {
    this.setState({amount: e.target.value})
  }
  public changeAddress = (e: any) => {
    const addresses = e.target.value.split(",").map((x: string) => x.trim())
    this.setState({addresses})
  }
  public handleClick = async () => {
    try {
      const txid = await wallet.send(this.state.addresses, +this.state.amount)
      this.setState({txid})
    } catch (error) {
      this.setState({txid: "Error(" + error + ")"})
    }
  }
  public render() {
    const totalAmount = "Total Send Amount: " + +this.state.amount * this.state.addresses.length + "satoshis"
    const qrcode = "http://chart.apis.google.com/chart?chs=150x150&cht=qr&chl=" + wallet.address
    return (
      <div className="App">
        <h1 className="App-title">Send BCH</h1>
        <h3>{totalAmount}</h3>
        <div>
          <input type="number" value={this.state.amount} onChange={this.changeAmount}/>
        </div>
        <div>
          <textarea placeholder="カンマ区切りでアドレスを入力して下さい" onChange={this.changeAddress}/>
        </div>
        <button onClick={this.handleClick}>Send BCH</button>
        <div>
          <h4>Your Wallet Address: {wallet.address}</h4>
          <img src={qrcode} alt="QRコード" />
          <h4>Your Current Balance: {this.state.balance}</h4>
          <h4>Latest TxID You Sent: {this.state.txid}</h4>
        </div>
      </div>
    )
  }
}

export default App
