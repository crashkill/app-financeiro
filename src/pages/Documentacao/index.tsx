import React from 'react';
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";
import { Description as DescriptionIcon } from "@mui/icons-material";
import { useState } from "react";
import Visao from "./components/Visao";
import Calculos from "./components/Calculos";
import Swagger from "./components/Swagger";
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Documentacao: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("visao");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <DescriptionIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
          <Typography variant="h4" component="h1" color="primary">
            Documentação do Sistema
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleChange}
            aria-label="documentação tabs"
          >
            <Tab label="Visão Geral" value="visao" />
            <Tab label="Cálculos" value="calculos" />
            <Tab label="API" value="swagger" />
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          {activeTab === "visao" && <Visao />}
          {activeTab === "calculos" && <Calculos />}
          {activeTab === "swagger" && <Swagger />}
        </Box>
      </Box>
    </Container>
  );
};

export default Documentacao;
