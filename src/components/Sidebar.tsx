import { useState } from 'react'
import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { Squash as Hamburger } from 'hamburger-react'
import {
  UilAnalytics,
  UilFileAlt,
  UilChartGrowth,
  UilCloudUpload,
  UilSetting,
  UilBook,
  UilBars,
  UilAngleRight,
  UilUser,
  UilShieldCheck
} from '@iconscout/react-unicons'
import { useConfig } from '../contexts/ConfigContext'

// Wrappers para os ícones usando parâmetros padrão via desestruturação
const Analytics =