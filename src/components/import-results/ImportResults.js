import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import * as styleProps  from '../ui/Styles';

export default class ImportResults extends React.Component {
	render () {
		let tableData;
		if(this.props.teiResponse.status === 'ERROR'){
			tableData = <Table>
					<h3> Import Summary </h3>
	          <TableBody>            
	            <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Imported
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          0
		          </TableCell>
		        </TableRow> 
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Updated
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          0
		          </TableCell>
		        </TableRow>   
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Ignored
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          0
		          </TableCell>
		        </TableRow>
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Deleted
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          0
		          </TableCell>
		        </TableRow>  
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Error
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		           1
		          </TableCell>
		        </TableRow>            
	          </TableBody>          
	        </Table>
		} else if(this.props.eventResponse.status === 'ERROR'){ 
			tableData = <Table>
					<h3> Import Summary </h3>
	          <TableBody>            
	            <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Imported
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          0
		          </TableCell>
		        </TableRow> 
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Updated
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          0
		          </TableCell>
		        </TableRow>   
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Ignored
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          0
		          </TableCell>
		        </TableRow>
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Deleted
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          0
		          </TableCell>
		        </TableRow>  
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Error
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		           1
		          </TableCell>
		        </TableRow>            
	          </TableBody>          
	        </Table>

		} else {

			let updateCount = 0, teiUpdateCount = 0, eventUpdateCount = 0, totalCount = 0, totalUpdated = 0, totalImported = 0, totalIgnored = 0, teiIgnored = 0, eventIgnored = 0; 
			
			teiUpdateCount   = this.props.teiResponse.response.updated;
			totalImported    = this.props.teiResponse.response.total;
			eventUpdateCount = this.props.eventResponse.response.updated;				
			totalUpdated     = this.props.eventResponse.response.total;

			updateCount  = parseInt(teiUpdateCount) + parseInt(eventUpdateCount);
			totalCount   = parseInt(totalImported) + parseInt(totalUpdated);
			totalIgnored = parseInt(teiIgnored) + parseInt(eventIgnored);
			
			tableData = <Table>

					<h3> Import Summary </h3>
	          <TableBody>            
	            <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Imported
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          {this.props.teiResponse.response.imported}
		          </TableCell>
		        </TableRow> 
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Updated
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          {updateCount}
		          </TableCell>
		        </TableRow>   
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Ignored
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          {totalIgnored}
		          </TableCell>
		        </TableRow>
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Deleted
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          0
		          </TableCell>
		        </TableRow>  
		        <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Total
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          {totalCount}
		          </TableCell>
		        </TableRow>            
	          </TableBody>          
	        </Table>
		}

		return (
      <div>
      	{tableData}
      </div>
		);
	}
}
