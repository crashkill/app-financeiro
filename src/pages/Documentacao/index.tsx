import React from 'react';
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";
import { Description as DescriptionIcon } from "@mui/icons-material";
import { useState } from "react";
import Visao from "./components/Visao";
import Calculos from "./components/Calculos";
import Arquitetura from "./components/Arquitetura";
import Componentes from "./components/Componentes";
import API from "./components/API";
import Banco from "./components/Banco";
import Deploy from "./components/Deploy";
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
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Visão Geral" value="visao" />
            <Tab label="Arquitetura" value="arquitetura" />
            <Tab label="Componentes" value="componentes" />
            <Tab label="Cálculos" value="calculos" />
            <Tab label="Banco de Dados" value="banco" />
            <Tab label="API" value="api" />
            <Tab label="Deploy" value="deploy" />
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          {activeTab === "visao" && <Visao />}
          {activeTab === "arquitetura" && <Arquitetura />}
          {activeTab === "componentes" && <Componentes />}
          {activeTab === "calculos" && <Calculos />}
          {activeTab === "banco" && <Banco />}
          {activeTab === "api" && <API />}
          {activeTab === "deploy" && <Deploy />}
        </Box>
      </Box>
    </Container>
  );
};

export default Documentacao;
