"use client"
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"

const minervaTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default:  "#0d0d1c",
      paper:    "#17172d",
    },
    primary: {
      main:        "#9fa3ff",
      contrastText: "#1a1a3a",
    },
    secondary: {
      main:        "#00dbe7",
      contrastText: "#001f2b",
    },
    error: {
      main: "#fd6f85",
    },
    success: {
      main: "#00dbe7",
    },
    warning: {
      main: "#ebb2ff",
    },
    text: {
      primary:   "#e4e3ff",
      secondary: "#a9a8cc",
      disabled:  "rgba(169, 168, 204, 0.38)",
    },
    divider: "rgba(69, 69, 100, 0.18)",
    action: {
      hover:    "rgba(159, 163, 255, 0.08)",
      selected: "rgba(159, 163, 255, 0.12)",
      disabled: "rgba(169, 168, 204, 0.3)",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Space Grotesk', sans-serif" },
    h2: { fontFamily: "'Space Grotesk', sans-serif" },
    h3: { fontFamily: "'Space Grotesk', sans-serif" },
    h4: { fontFamily: "'Space Grotesk', sans-serif" },
    h5: { fontFamily: "'Space Grotesk', sans-serif" },
    h6: { fontFamily: "'Space Grotesk', sans-serif" },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#17172d",
          border: "1px solid rgba(69, 69, 100, 0.18)",
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#17172d",
          border: "1px solid rgba(69, 69, 100, 0.18)",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#111124",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "rgba(69, 69, 100, 0.18)",
          color: "#a9a8cc",
        },
        head: {
          color: "#a9a8cc",
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          backgroundColor: "#111124",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(159, 163, 255, 0.04)",
          },
          "&:last-child td, &:last-child th": {
            border: 0,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          borderRadius: "0.75rem",
        },
        contained: {
          background: "linear-gradient(135deg, #9fa3ff 0%, #00dbe7 100%)",
          color: "#1a1a3a",
          boxShadow: "0 4px 14px rgba(159, 163, 255, 0.25)",
          "&:hover": {
            background: "linear-gradient(135deg, #b3b6ff 0%, #1fe5ef 100%)",
            boxShadow: "0 6px 20px rgba(159, 163, 255, 0.35)",
          },
        },
        containedSuccess: {
          background: "linear-gradient(135deg, #9fa3ff 0%, #00dbe7 100%)",
          color: "#1a1a3a",
          "&:hover": {
            background: "linear-gradient(135deg, #b3b6ff 0%, #1fe5ef 100%)",
          },
        },
        outlined: {
          borderColor: "rgba(69, 69, 100, 0.4)",
          color: "#a9a8cc",
          "&:hover": {
            borderColor: "#9fa3ff",
            color: "#9fa3ff",
            backgroundColor: "rgba(159, 163, 255, 0.08)",
          },
        },
        text: {
          color: "#a9a8cc",
          "&:hover": {
            backgroundColor: "rgba(159, 163, 255, 0.08)",
            color: "#9fa3ff",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& label": {
            color: "#a9a8cc",
            fontFamily: "'Inter', sans-serif",
          },
          "& label.Mui-focused": {
            color: "#9fa3ff",
          },
          "& .MuiInput-underline:before": {
            borderBottomColor: "rgba(69, 69, 100, 0.4)",
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: "#a9a8cc",
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: "#9fa3ff",
          },
          "& .MuiInputBase-input": {
            color: "#e4e3ff",
            fontFamily: "'Inter', sans-serif",
          },
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#000000",
            "& fieldset": {
              borderColor: "rgba(69, 69, 100, 0.4)",
            },
            "&:hover fieldset": {
              borderColor: "#a9a8cc",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#9fa3ff",
              boxShadow: "0 0 0 1px #9fa3ff, 0 0 4px rgba(159, 163, 255, 0.4)",
            },
          },
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        backdrop: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: "#9fa3ff",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "#a9a8cc",
          fontFamily: "'Inter', sans-serif",
          "&.Mui-selected": {
            color: "#9fa3ff",
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: "#9fa3ff",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: "#e4e3ff",
        },
        h4: {
          fontFamily: "'Space Grotesk', sans-serif",
        },
        h5: {
          fontFamily: "'Space Grotesk', sans-serif",
        },
        h6: {
          fontFamily: "'Space Grotesk', sans-serif",
        },
        body2: {
          color: "#a9a8cc",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(69, 69, 100, 0.18)",
        },
      },
    },
  },
})

export default function MinervaThemeProvider({ children }) {
  return (
    <MuiThemeProvider theme={minervaTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
