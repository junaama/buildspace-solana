import { useEffect, useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import kp from './keypair.json'
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import idl from "./idl.json";

const { SystemProgram, Keypair } = web3;
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr);
const baseAccount = Keypair.fromSecretKey(secret);
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed",
};
// Constants
const TWITTER_HANDLE = "0naama";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      // Checking window object in DOM for pHantom wAllet
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom Wallet found");
          // If a user is already connected, onlyIfTrusted will pull their data without prompting them with another connect popup
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Connected with Public Key: ",
            response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found. Get a Phantom Wallet !!!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log("Connected with Public Key: ", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };
  const onInputChange = (e) => {
    const { value } = e.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };
  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created new BaseAccount with address: ",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account: ", error);
    }
  };
  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("NO gif link given:", inputValue);
      return
    } 
    console.log("Gif link: ", inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue);
      await getGifList();
    } catch (error) {
      console.log("Error sending GIFS: ", error)
    }
  };
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );
  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    } else {
      console.log("Gif List: ", gifList)
      return (
        <div className="connected-container">
          <input
            type="text"
            placeholder="Enter link to a gif"
            value={inputValue}
            onChange={onInputChange}
          />
          <button className="cta-button submit-gif-button" onClick={sendGif}>
            Submit
          </button>
          <div className="gif-grid">
            {gifList.map((gif, index) => (
              <div className="gif-item" key={index}>
                <img src={gif.gifLink} alt={"fairies"} />
              </div>
            ))}
          </div>
        </div>
      );
    }
  };
  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );
      console.log("Got the Account: ", account);
      setGifList(account.gifList);
    } catch (error) {
      console.log("Error in getGifs: ", error);
      setGifList(null);
    }
  };
  useEffect(() => {
    // Phantom team suggests waiting for window to load before checking for solana object
    window.addEventListener("load", async (event) => {
      await checkIfWalletIsConnected();
    });
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching gif list....");
      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">🖼 Fairyverse Portal</p>
          <p className="sub-text">
            View your sparkling GIF collection in the fairyverse ✨
          </p>
          {walletAddress
            ? renderConnectedContainer()
            : renderNotConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
