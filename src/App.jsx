import React, { useEffect, useState } from "react";
import {ethers} from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const App = () => {

  //  Just a state variable we use to store our user's public wallet
  const [currentAccount, setCurrentAccount] = useState("");

  // all state property to store all waves
  const [allWaves, setAllWaves] = useState([]);

  // assigning the contract address for the wavePortal contract. 
  //const contractAddress = '0xAcD15Fa4073Ffa6273B47F7C9Ea0AaAea61848b8';
  const contractAddress = '0xFF1Ba0F14E99b404BcE15cEeCEaA888FE0986527';
  
  // create a variable that references the abi content.
  const contractABI = abi.abi;

  // Create a new method that gets all the waves from the contract
  const getAllWaves = async () => {
    const { ethereum } = window;
    
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        //call the getAllWaves method from the smart contract
        const waves = await wavePortalContract.getAllWaves();

        
        // modifying the wavesCleaned array
        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          }
        });

        //Store the data in a React State
        setAllWaves(wavesCleaned);
        
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Listen for an emitter!
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(preveState => [
        ...prevState,
        {
          addresss: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  
  const checkIfWalletIsConnected = async () => {
    try {
      // First we have to make sure we have access to window.ethereum
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
        let allWavesToPost = await getAllWaves();
        console.log(allWavesToPost);
      }

      //Check if we are authorized to accesss the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });
    
      if (accounts.length !==0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }     

  // Implement your connect wallet method here
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  // Call the getTotalWaves function from the contract
  const wave = async () => {
    try {
      const {ethereum} = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        //here is where contractABI is being used.
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        

        // executing the 'wave' from the deployed smart contract
        const waveTxn = await wavePortalContract.wave(document.getElementById("message").value, {gasLimit: 300000});
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log*("Mined --", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        // console.log("message: %s", document.getElementById("message").value);

        document.location.reload(true);
        
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (error) {
      console.log(error);
    }
  }

  
  // This runs our function when the page loads
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])


  // The HTML code part

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        👋 Hey there, Friend!
        </div>

        <div className="bio">
        I'm Colin. Welcome to my project. Please connect your Ethereum wallet and wave at me!
        </div>
        {/* Adding a Text Box with placeholder text and assinging the string to the     
          variable "message"*/}
        <input type="text" id="message" placeholder="Enter Message Here">
        </input>
        <button className="waveButton" onClick={wave}>
          Wave at Me!
        </button>

        {/* If there is no currentAccount render this button */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: 
              "OldLacee", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
} 

export default App
