import { Box, Container, styled, Typography } from "@mui/material";
import React from "react";
import logoImg from "../../img/t1.jpg";
import starsImg from "../../img/Star.png";

const Companies = () => {
  const CustomContainer = styled(Container)(({ theme }) => ({
    display: "flex",
    justifyContent: "space-between",
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      marginBottom: theme.spacing(4),
    },
  }));

  const CustomBox = styled(Box)(({ theme }) => ({
    [theme.breakpoints.down("md")]: {
      marginBottom: theme.spacing(4),
    },
  }));

  return (
    <Box sx={{ mt: 10 }}>
      <CustomContainer>
        <CustomBox>
          <img src={logoImg} alt="logo" style={{ maxWidth: "100%" }} />
          <Typography
            variant="body2"
            sx={{
              color: "#7D8589",
              fontSize: "16px",
              fontWeight: "bold",
              mt: 2,
            }}
          >
            More than 45,000 trust <b><i>TrueTag</i></b>
          </Typography>
        </CustomBox>

        <Box>
          <img src={starsImg} alt="stars" style={{ maxWidth: "100%" }} />
          <Typography
            variant="body2"
            sx={{
              color: "#7D8589",
              fontSize: "16px",
              fontWeight: "bold",
              mt: 2,
            }}
          >
            5-Star Rating
          </Typography>
        </Box>
      </CustomContainer>

      <Container sx={{ display: "flex", flexDirection: "column" }}>
      </Container>
    </Box>
  );
};

export default Companies;
