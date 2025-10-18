import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Breadcrumbs, 
  Link, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TableSortLabel,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Folder as FolderIcon, 
  InsertDriveFile as FileIcon,
  ArrowUpward as UpIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  MoreVert as MoreVertIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { ipcRenderer } from 'electron';
import path from 'path';

const FileExplorer = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  const [drives, setDrives] = useState([]);
  const [showDrives, setShowDrives] = useState(true);

  useEffect(() => {
    // Get all available drives
    const getDrives = async () => {
      try {
        // For Windows
        if (window.process.platform === 'win32') {
          const { exec } = window.require('child_process');
          exec('wmic logicaldisk get name', (error, stdout) => {
            if (!error) {
              const drivesList = stdout.split('\r\n')
                .filter(value => /[A-Za-z]:/.test(value))
                .map(value => ({
                  name: value.trim(),
                  path: value.trim() + '\\',
                  isDirectory: true,
                  isDrive: true
                }));
              setDrives(drivesList);
              setShowDrives(true);
            } else {
              // Fallback to showing home directory if drive detection fails
              const homeDir = process.env.HOME || process.env.USERPROFILE;
              navigateToPath(homeDir);
            }
          });
        } else {
          // For Linux/Mac
          const homeDir = process.env.HOME;
          navigateToPath(homeDir);
        }
      } catch (error) {
        console.error('Error getting drives:', error);
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        navigateToPath(homeDir);
      }
    };

    getDrives();
  }, []);

  const handleDriveClick = (drivePath) => {
    navigateToPath(drivePath);
    setShowDrives(false);
  };

  const navigateToPath = async (newPath) => {
    try {
      setLoading(true);
      const fileList = await ipcRenderer.invoke('read-directory', newPath);
      
      // Sort files and folders
      const sortedFiles = [...fileList].sort((a, b) => {
        // Directories first, then files
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        // Then sort by name
        return a.name.localeCompare(b.name);
      });
      
      setFiles(sortedFiles);
      setCurrentPath(newPath);
      updateBreadcrumbs(newPath);
    } catch (error) {
      console.error('Error reading directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBreadcrumbs = (pathStr) => {
    const parts = path.parse(pathStr);
    const crumbs = [];
    let currentPath = '';
    
    // Handle Windows paths
    const pathParts = pathStr.split(path.sep).filter(Boolean);
    
    pathParts.forEach((part, index) => {
      currentPath = currentPath ? path.join(currentPath, part) : part + path.sep;
      crumbs.push({
        name: index === 0 ? part : part,
        path: currentPath
      });
    });
    
    setBreadcrumbs(crumbs);
  };

  const handleFileClick = (file) => {
    if (file.isDirectory) {
      navigateToPath(file.path);
    } else {
      // Handle file open (will be implemented later)
      console.log('Opening file:', file.path);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const navigateUp = () => {
    const parentDir = path.dirname(currentPath);
    if (parentDir !== currentPath) { // Prevent infinite loop
      navigateToPath(parentDir);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = path.extname(fileName).toLowerCase();
    // Add more file type icons as needed
    return <FileIcon />;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Path and Search Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, mr: 2 }}>
          <Tooltip title="Go to Drives">
            <IconButton 
              onClick={() => setShowDrives(true)} 
              sx={{ mr: 1 }}
            >
              <StorageIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Go up">
            <IconButton 
              onClick={navigateUp} 
              disabled={!currentPath || currentPath === path.parse(currentPath).root}
            >
              <UpIcon />
            </IconButton>
          </Tooltip>
          <Breadcrumbs aria-label="breadcrumb" sx={{ flex: 1, ml: 1 }}>
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={index}
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToPath(crumb.path);
                }}
                underline="hover"
              >
                {crumb.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search in this folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 1, width: 300 }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={() => navigateToPath(currentPath)}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={viewMode === 'list' ? 'Grid view' : 'List view'}>
            <IconButton onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
              {viewMode === 'list' ? <GridViewIcon /> : <ListViewIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Drives View */}
      {showDrives ? (
        <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>Select a Drive</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {drives.map((drive, index) => (
              <Paper 
                key={index} 
                onClick={() => handleDriveClick(drive.path)}
                sx={{
                  p: 2,
                  minWidth: 120,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                elevation={3}
              >
                <FolderIcon color="primary" sx={{ fontSize: 48 }} />
                <Typography variant="body1">{drive.name}</Typography>
              </Paper>
            ))}
          </Box>
        </Paper>
      ) : loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ width: '100%' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'name'}
                      direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortConfig.key === 'size'}
                      direction={sortConfig.key === 'size' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('size')}
                    >
                      Size
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortConfig.key === 'modified'}
                      direction={sortConfig.key === 'modified' ? sortConfig.direction : 'desc'}
                      onClick={() => handleSort('modified')}
                    >
                      Modified
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedFiles.map((file, index) => (
                  <TableRow 
                    key={index} 
                    hover 
                    onClick={() => handleFileClick(file)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {file.isDirectory ? (
                          <FolderIcon color="primary" sx={{ mr: 1 }} />
                        ) : (
                          getFileIcon(file.name)
                        )}
                        <Typography variant="body2">{file.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{file.isDirectory ? 'Folder' : path.extname(file.name).toUpperCase().replace('.', '') || 'File'}</TableCell>
                    <TableCell align="right">
                      {!file.isDirectory && file.size ? formatFileSize(file.size) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {file.modified ? new Date(file.modified).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedFiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        {searchQuery ? 'No files match your search' : 'This folder is empty'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default FileExplorer;
