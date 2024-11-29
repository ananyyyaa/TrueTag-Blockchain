import { Box, Paper, Typography, Autocomplete } from "@mui/material";
import bgImg from "../../img/bg.png";
import { TextField, Button } from "@mui/material";
import { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import { ethers } from "ethers";
import axios from "axios";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import abi from "../../utils/Identeefi.json";

const options = ["true", "false"];

const getEthereumObject = () => window.ethereum;

const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();
    if (!ethereum) {
      console.error("Make sure you have Metamask!");
      return null;
    }
    const accounts = await ethereum.request({ method: "eth_accounts" });
    return accounts.length !== 0 ? accounts[0] : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const UpdateProductDetails = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [currDate, setCurrDate] = useState("");
  const [currLatitude, setCurrLatitude] = useState("");
  const [currLongtitude, setCurrLongtitude] = useState("");
  const [currName, setCurrName] = useState("");
  const [currLocation, setCurrLocation] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [isSold, setIsSold] = useState(false);
  const [loading, setLoading] = useState("");

  const CONTRACT_ADDRESS = "0x62081f016446585cCC507528cc785980296b4Ccd";
  const CONTRACT_ABI = abi.abi;

  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qrData = location.state?.qrData;

  useEffect(() => {
    const data = qrData.split(",");
    setSerialNumber(data[1]);
    findMetaMaskAccount().then((account) => {
      if (account !== null) {
        setCurrentAccount(account);
      }
    });
  });

  useEffect(() => {
    getUsername();
    getCurrentTimeLocation();
  }, []);

  useEffect(() => {
    if (currLatitude && currLongtitude) {
      getLocationFromCoordinates(currLatitude, currLongtitude);
    }
  }, [currLatitude, currLongtitude]);

  const getCurrentTimeLocation = () => {
    setCurrDate(dayjs().unix());
    navigator.geolocation.getCurrentPosition((position) => {
      setCurrLatitude(position.coords.latitude);
      setCurrLongtitude(position.coords.longitude);
    });
  };

  const getLocationFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: "json",
          },
        }
      );

      const address = response.data.display_name;
      setCurrLocation(address.replace(/,/g, ";"));
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  const getUsername = async () => {
    const res = await axios.get(`http://localhost:5000/profile/${auth.user}`);
    setCurrName(res?.data[0].name);
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const productContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        const registerTxn = await productContract.addProductHistory(
          serialNumber,
          currName,
          currLocation,
          currDate.toString(),
          Boolean(isSold)
        );
        setLoading("Mining (Add Product History) ...", registerTxn.hash);
        await registerTxn.wait();
        setLoading("Mined (Add Product History) --", registerTxn.hash);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(
      "Please pay the transaction fee to update the product details..."
    );
    await updateProduct(e);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(${bgImg})`,
        minHeight: "80vh",
        backgroundRepeat: "no-repeat",
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundSize: "cover",
        zIndex: -2,
        overflowY: "scroll",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "400px",
          margin: "auto",
          marginTop: "10%",
          marginBottom: "10%",
          padding: "3%",
          backgroundColor: "#e3eefc",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            textAlign: "center",
            marginBottom: "3%",
            fontFamily: "Gambetta",
            fontWeight: "bold",
            fontSize: "2.5rem",
          }}
        >
          Update Product Details
        </Typography>
        <TextField
          fullWidth
          id="outlined-disabled"
          margin="normal"
          label="Serial Number"
          disabled
          value={serialNumber}
        />
        <TextField
          fullWidth
          id="outlined-disabled"
          margin="normal"
          label="Name"
          disabled
          value={currName}
        />
        <TextField
          fullWidth
          id="outlined-disabled"
          margin="normal"
          label="Location"
          disabled
          multiline
          minRows={2}
          value={currLocation.replace(/;/g, ",")}
        />
        <TextField
          fullWidth
          id="outlined-disabled"
          margin="normal"
          label="Date"
          disabled
          value={dayjs(currDate * 1000).format("MMMM D, YYYY h:mm A")}
        />
        {auth.role === "supplier" ? null : (
          <Autocomplete
            disablePortal
            id="combo-box-demo"
            options={options}
            fullWidth
            value={isSold}
            onChange={(event, newVal) => setIsSold(newVal)}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                id="outlined-basic"
                margin="normal"
                label="Is Sold?"
                variant="outlined"
              />
            )}
          />
        )}
        {loading && (
          <Typography
            variant="body2"
            sx={{ textAlign: "center", marginTop: "3%" }}
          >
            {loading}
          </Typography>
        )}
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            type="submit"
            onClick={handleSubmit}
            sx={{
              textAlign: "center",
              width: "50%",
              marginTop: "3%",
              backgroundColor: "#98b5d5",
              "&:hover": { backgroundColor: "#618dbd" },
            }}
          >
            Update Product
          </Button>
        </Box>
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Button onClick={handleBack} sx={{ marginTop: "5%" }}>
            Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default UpdateProductDetails;
