import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import * as styleProps  from '../ui/Styles';
import { Card } from '@dhis2/ui-core';

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
		} else if(typeof this.props.eventResponse === 'undefined'){ 
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
			let data = this.props.teiResponse;	
			let updateCount = 0, teiUpdateCount = 0, eventUpdateCount = 0, totalCount = 0, totalUpdated = 0, totalImported = 0, totalIgnored = 0, teiIgnored = 0, eventIgnored = 0; 
			
			teiUpdateCount   = data.updated;
			totalImported    = data.total;
			eventUpdateCount = this.props.eventResponse.updated;				
			totalUpdated     = this.props.eventResponse.total;

			updateCount  = Number(teiUpdateCount) + Number(eventUpdateCount);
			totalCount   = Number(totalImported) + Number(totalUpdated);
			totalIgnored = Number(teiIgnored) + Number(eventIgnored);
			
			tableData = <Table>

					<h3> Import Summary </h3>
	          <TableBody>            
	            <TableRow>
		          <TableCell style={styleProps.styles.tableHeader}>
		          Imported
		          </TableCell> 
		          <TableCell style={styleProps.styles.tableHeader}>
		          {data.imported}
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
      <div className="importPreview">
      	<Card className="importPreview">
      		{tableData}
      	</Card>
      </div>
		);
	}
}
