import { Box, Paper, Typography, TextField, Button } from "@mui/material";
import bgImg from "../../img/bg.png";
import { ethers } from "ethers";
import axios from "axios";
import abi from "../../utils/Identeefi.json";
import QRCode from "qrcode.react";
import dayjs from "dayjs";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import watermark from "../../img/watermark.png";

const getEthereumObject = () => window.ethereum;

const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();
    if (!ethereum) {
      console.error("Make sure you have Metamask!");
      alert("Make sure you have Metamask!");
      return null;
    }

    console.log("We have the Ethereum object", ethereum);
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      return account;
    } else {
      console.error("No authorized account found");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const AddProduct = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState({
    file: [],
    filepreview: null,
  });
  const [qrData, setQrData] = useState("");
  const [manuDate, setManuDate] = useState(dayjs().unix());
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [productLocation, setProductLocation] = useState("");
  const [manuName, setManuName] = useState("");
  const [loading, setLoading] = useState("");
  const [isUnique, setIsUnique] = useState(true);
  const canvasRef = useRef(); // Ref for the canvas

  const CONTRACT_ADDRESS = "0x62081f016446585cCC507528cc785980296b4Ccd";
  const contractABI = abi.abi;
  const { auth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    findMetaMaskAccount().then((account) => {
      if (account !== null) {
        setCurrentAccount(account);
      }
    });
    getUsername();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      getLocationFromCoordinates(latitude, longitude).then((address) => {
        setProductLocation(address);
      });
    }
  }, [latitude, longitude]);

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    });
  };

  const getLocationFromCoordinates = async (latitude, longitude) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
        latitude
      )}&lon=${encodeURIComponent(longitude)}&format=json`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          "Nominatim API request failed with status:",
          response.status
        );
        return "";
      }

      const data = await response.json();
      if (data && data.address) {
        const address = data.display_name.replace(/,/g, ";");
        console.log("Address:", address);
        return address;
      } else {
        console.error("Address not found");
        return "";
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      return "";
    }
  };

  const generateQRCode = async (serialNumber) => {
    const data = CONTRACT_ADDRESS + `,` + serialNumber;
    setQrData(data);
    console.log("QR Code: ", qrData);
  };

  const generateQRWithWatermark = () => {
    const canvas = canvasRef.current;
    const qrCanvas = document.querySelector("canvas"); // Get QR code canvas
    const context = canvas.getContext("2d");
  
    // Set canvas dimensions to match the QR code
    canvas.width = qrCanvas.width;
    canvas.height = qrCanvas.height;
  
    // Draw the QR code onto the main canvas
    context.drawImage(qrCanvas, 0, 0);
  
    // Load the watermark image
    const watermarkImage = new Image();
    watermarkImage.src = watermark // Replace with the actual image path
  
    watermarkImage.onload = () => {
      const watermarkWidth = 80;  // Set watermark width
      const watermarkHeight = 80; // Set watermark height
  
      // Position the watermark image (center it on the canvas)
      const x = (canvas.width - watermarkWidth) / 2;
      const y = (canvas.height - watermarkHeight) / 2;
  
      // Optional: Set transparency for the watermark
      context.globalAlpha = 0.5;
  
      // Draw the watermark image on top of the QR code
      context.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight);
    };
  };
  
  
  const downloadQR = () => {
    const canvas = canvasRef.current;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${serialNumber}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  const handleBack = () => {
    navigate(-1);
  };

  // Rest of the unchanged functions (handleImage, getUsername, uploadImage, registerProduct, addProductDB, checkUnique, handleSubmit)...
  const handleImage = (e) => {
    setImage({
      ...image,
      file: e.target.files[0],
      filepreview: URL.createObjectURL(e.target.files[0]),
    });
  };

  const getUsername = async () => {
    const res = await axios.get(`http://localhost:5000/profile/${auth.user}`);
    setManuName(res?.data[0]?.name || "");
  };

  const uploadImage = async (image) => {
    const data = new FormData();
    data.append("image", image.file);

    axios
      .post("http://localhost:5000/upload/product", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        if (res.data.success === 1) {
          console.log("Image uploaded");
        }
      });
  };

  const registerProduct = async (e) => {
    e.preventDefault();
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const productContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );

        const registerTxn = await productContract.registerProduct(
          name,
          brand,
          serialNumber,
          description.replace(/,/g, ";"),
          image.file.name,
          manuName,
          productLocation,
          manuDate.toString()
        );

        setLoading("Mining (Register Product) ...");
        await registerTxn.wait();
        setLoading("");
        generateQRCode(serialNumber);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addProductDB = async () => {
    const profileData = {
      serialNumber,
      name,
      brand,
    };
    await axios.post("http://localhost:5000/addproduct", profileData, {
      headers: { "Content-Type": "application/json" },
    });
  };

  const checkUnique = async () => {
    const res = await axios.get("http://localhost:5000/product/serialNumber");
    const existingSerialNumbers = res.data.map(
      (product) => product.serialnumber
    );
    const isDuplicate = existingSerialNumbers.includes(serialNumber);

    setIsUnique(!isDuplicate);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await checkUnique();

    if (isUnique) {
      await uploadImage(image);
      await addProductDB();
      await registerProduct(e);
    }
  };
  return (
    <Box
      sx={{
        backgroundImage: `url(${bgImg})`,
        minHeight: "100vh",
        backgroundRepeat: "no-repeat",
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
          Add Product
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            error={!isUnique}
            helperText={!isUnique ? "Serial Number already exists" : ""}
            label="Serial Number"
            variant="outlined"
            onChange={(e) => setSerialNumber(e.target.value)}
            value={serialNumber}
          />
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
          <TextField
            fullWidth
            label="Brand"
            variant="outlined"
            onChange={(e) => setBrand(e.target.value)}
            value={brand}
          />
          <TextField
            fullWidth
            label="Description"
            variant="outlined"
            multiline
            minRows={2}
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ marginTop: "3%", marginBottom: "3%" }}
          >
            Upload Image
            <input type="file" hidden onChange={handleImage} />
          </Button>

          {image.filepreview && (
            <img
              src={image.filepreview}
              alt="preview"
              style={{ width: "100%", height: "100%" }}
            />
          )}
          <Button
            variant="contained"
            type="submit"
            sx={{
              width: "100%",
              marginTop: "3%",
              backgroundColor: "#3f51b5",
              color: "white",
            }}
          >
            Register Product
          </Button>
          <QRCode value={qrData} style={{ display: "none" }} />
          <canvas
            ref={canvasRef}
            style={{
              border: "1px solid black",

              marginLeft: "100px",
              marginTop: "20px",
              width: "200px",
              height: "200px",
              marginBottom: "20px",
            }}
          ></canvas>

          <Button
            variant="contained"
            sx={{
              width: "100%",
              marginTop: "3%",
              backgroundColor: "#3f51b5",
              color: "white",
            }}
            onClick={generateQRWithWatermark}
            style={{ marginTop: "10px" }}
          >
            Generate QR Code with Watermark
          </Button>
          <Button
            variant="contained"
            sx={{
              width: "100%",
              marginTop: "3%",
              backgroundColor: "#3f51b5",
              color: "white",
            }}
            onClick={downloadQR}
            style={{ marginTop: "10px" }}
          >
            Download Watermarked QR Code
          </Button>
          {loading && (
            <Typography
              variant="body2"
              sx={{ textAlign: "center", marginTop: "3%" }}
            >
              {loading}
            </Typography>
          )}

          <Button
            variant="outlined"
            onClick={handleBack}
            sx={{ width: "100%", marginTop: "3%" }}
          >
            Back
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AddProduct;
