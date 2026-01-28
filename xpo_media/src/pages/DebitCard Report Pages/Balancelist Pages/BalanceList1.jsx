import React, { useState, useEffect } from 'react'

import { Container, Card, Table, Button, Spinner, Row, Col, Form } from 'react-bootstrap'

import { useNavigate } from 'react-router-dom'

import { toast, ToastContainer } from 'react-toastify'

import "react-toastify/dist/ReactToastify.css"

import jsPDF from "jspdf"

import autoTable from "jspdf-autotable"

import MainContentPage from "../../../components/MainContent/MainContentPage"

import { useAuthContext } from "../../../Context/AuthContext"

import { ENDPOINTS } from "../../../SpringBoot/config"

import { FaArrowLeft, FaFilter, FaFilePdf } from "react-icons/fa"



const BalanceList1 = () => {

  const navigate = useNavigate()

  const { getAuthHeaders, schoolId, currentAcademicYear } = useAuthContext()

  

  // Data States

  const [reportData, setReportData] = useState([])

  const [isLoading, setIsLoading] = useState(false)

  const [hasGenerated, setHasGenerated] = useState(false)



  // Filter States

  const [filters, setFilters] = useState({

    standard: "",

    section: "",

    feeHead: ""

  })



  // Dropdown Data States

  const [setupData, setSetupData] = useState({

    standards: [],

    sections: [],

    feeHeads: [] 

  })



  // Totals State

  const [totals, setTotals] = useState({

    acadFixed: 0, acadPaid: 0, acadBal: 0,

    transFixed: 0, transPaid: 0, transBal: 0,

    concession: 0, totFixed: 0, actPaid: 0, totPaid: 0, totBal: 0

  })



  // 1. Fetch Dropdown Data on Mount (No Report Load)

  useEffect(() => {

    if (schoolId && currentAcademicYear) {

      fetchSetupData()

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [schoolId, currentAcademicYear])



  const fetchSetupData = async () => {

    try {

      // Fetch Courses, Sections, and Fee Heads

      const [coursesRes, sectionsRes, feeHeadsRes] = await Promise.all([

        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`, { headers: getAuthHeaders() }),

        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`, { headers: getAuthHeaders() }),

        fetch(`${ENDPOINTS.reports}/fee-heads?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { headers: getAuthHeaders() })

      ])



      if (coursesRes.ok && sectionsRes.ok) {

        const courses = await coursesRes.json()

        const sections = await sectionsRes.json()

        const feeHeads = feeHeadsRes.ok ? await feeHeadsRes.json() : []



        setSetupData(prev => ({

          ...prev,

          standards: courses || [],

          sections: sections || [],

          feeHeads: feeHeads || [] 

        }))

      }

    } catch (error) {

      console.error("Error fetching setup data:", error)

    }

  }



  // 2. Handle Filter Changes

  const handleFilterChange = (e) => {

    const { name, value } = e.target

    setFilters(prev => ({ ...prev, [name]: value }))

  }



  // 3. Generate Report (Fetch & Filter)

  const handleGenerate = async () => {

    if (!schoolId || !currentAcademicYear) return

    setIsLoading(true)

    setHasGenerated(true)



    try {

      // Build Query Params

      let queryParams = `?schoolId=${schoolId}&academicYear=${currentAcademicYear}`

      if (filters.feeHead) queryParams += `&feeHead=${encodeURIComponent(filters.feeHead)}`

      

      const response = await fetch(

        `${ENDPOINTS.reports}/balance-list-1${queryParams}`,

        { headers: getAuthHeaders() }

      )



      if (response.ok) {

        let data = await response.json()



        // Apply Standard/Section Client-Side Filtering (Fee Head is handled by Backend)

        if (filters.standard) {

          data = data.filter(row => row.standard === filters.standard)

        }

        if (filters.section) {

          data = data.filter(row => row.section === filters.section)

        }



        setReportData(data)

        calculateGrandTotals(data)

        if(data.length === 0) toast.info("No records found for selected filters")

      } else {

        toast.error("Failed to fetch balance list report")

      }

    } catch (error) {

      console.error("Error:", error)

      toast.error("Error loading report data")

    } finally {

      setIsLoading(false)

    }

  }



  const calculateGrandTotals = (data) => {

    const newTotals = data.reduce((acc, row) => ({

      acadFixed: acc.acadFixed + (row.academicFixed || 0),

      acadPaid: acc.acadPaid + (row.academicPaid || 0),

      acadBal: acc.acadBal + (row.academicBalance || 0),

      transFixed: acc.transFixed + (row.transportFixed || 0),

      transPaid: acc.transPaid + (row.transportPaid || 0),

      transBal: acc.transBal + (row.transportBalance || 0),

      concession: acc.concession + (row.concession || 0),

      totFixed: acc.totFixed + (row.totalFixed || 0),

      actPaid: acc.actPaid + (row.actualPaid || 0),

      totPaid: acc.totPaid + (row.totalPaid || 0),

      totBal: acc.totBal + (row.totalBalance || 0),

    }), {

      acadFixed: 0, acadPaid: 0, acadBal: 0,

      transFixed: 0, transPaid: 0, transBal: 0,

      concession: 0, totFixed: 0, actPaid: 0, totPaid: 0, totBal: 0

    })

    setTotals(newTotals)

  }



  const exportPDF = () => {

    const doc = new jsPDF('landscape') 

    

    doc.setFontSize(14)

    doc.text("Balance List Report (Class Wise Summary)", 14, 15)

    doc.setFontSize(10)

    doc.text(`Academic Year: ${currentAcademicYear}`, 14, 22)

    

    let filterText = ""

    if(filters.standard) filterText += `Standard: ${filters.standard} `

    if(filters.feeHead) filterText += `| Fee Head: ${filters.feeHead}`

    if(filterText) doc.text(filterText, 14, 28)



    const tableColumn = [

      "Grade", "Sec", 

      "Fee/Acad Fix", "Paid", "Bal",

      "Transport Fix", "Paid", "Bal",

      "Conc", "Tot Fix", "Act Paid", "Tot Paid", "Tot Bal"

    ]



    const tableRows = reportData.map(row => [

      row.standard,

      row.section,

      row.academicFixed?.toFixed(2),

      row.academicPaid?.toFixed(2),

      row.academicBalance?.toFixed(2),

      row.transportFixed?.toFixed(2),

      row.transportPaid?.toFixed(2),

      row.transportBalance?.toFixed(2),

      row.concession?.toFixed(2),

      row.totalFixed?.toFixed(2),

      row.actualPaid?.toFixed(2),

      row.totalPaid?.toFixed(2),

      row.totalBalance?.toFixed(2)

    ])



    tableRows.push([

      "TOTAL", "",

      totals.acadFixed.toFixed(2),

      totals.acadPaid.toFixed(2),

      totals.acadBal.toFixed(2),

      totals.transFixed.toFixed(2),

      totals.transPaid.toFixed(2),

      totals.transBal.toFixed(2),

      totals.concession.toFixed(2),

      totals.totFixed.toFixed(2),

      totals.actPaid.toFixed(2),

      totals.totPaid.toFixed(2),

      totals.totBal.toFixed(2)

    ])



    autoTable(doc, {

      head: [tableColumn],

      body: tableRows,

      startY: filterText ? 35 : 30,

      theme: 'grid',

      styles: { fontSize: 8, halign: 'right' },

      columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' } }, 

      headStyles: { fillColor: [11, 61, 123] },

      didParseCell: function (data) {

        if (data.row.index === tableRows.length - 1) {

          data.cell.styles.fontStyle = 'bold';

          data.cell.styles.fillColor = [220, 220, 220];

        }

      }

    })



    doc.save("Balance_List_Summary.pdf")

  }



  return (

    <MainContentPage>

      <Container fluid className="px-4 py-3">

        <ToastContainer position="top-right" />

        

        {/* Header Section with Back Button */}

        <div className="d-flex align-items-center mb-3">

            <Button 

                variant="link" 

                className="text-dark p-0 me-3 text-decoration-none" 

                onClick={() => navigate(-1)}

            >

                <FaArrowLeft size={18} /> Back

            </Button>

            <h4 className="mb-0 fw-bold text-primary">Balance List Report (Class Wise)</h4>

        </div>



        {/* Filter Card */}

        <Card className="shadow-sm border-0 mb-4 bg-light">

            <Card.Body className="p-3">

                <Row className="g-3 align-items-end">

                    <Col md={3} sm={6}>

                        <Form.Label className="small fw-bold text-muted">Standard / Course</Form.Label>

                        <Form.Select 

                            size="sm" 

                            name="standard" 

                            value={filters.standard} 

                            onChange={handleFilterChange}

                        >

                            <option value="">All Standards</option>

                            {setupData.standards.map(std => (

                                <option key={std.id} value={std.name}>{std.name}</option>

                            ))}

                        </Form.Select>

                    </Col>

                    <Col md={2} sm={6}>

                        <Form.Label className="small fw-bold text-muted">Section</Form.Label>

                        <Form.Select 

                            size="sm" 

                            name="section" 

                            value={filters.section} 

                            onChange={handleFilterChange}

                        >

                            <option value="">All Sections</option>

                            {setupData.sections.map(sec => (

                                <option key={sec.id} value={sec.name}>{sec.name}</option>

                            ))}

                        </Form.Select>

                    </Col>

                    <Col md={3} sm={6}>

                        <Form.Label className="small fw-bold text-muted">Fee Head</Form.Label>

                        <Form.Select 

                            size="sm" 

                            name="feeHead" 

                            value={filters.feeHead} 

                            onChange={handleFilterChange}

                        >

                            <option value="">All Fee Heads</option>

                            {setupData.feeHeads.map((head, idx) => (

                                <option key={idx} value={head}>{head}</option>

                            ))}

                        </Form.Select>

                    </Col>

                    <Col md={2} sm={6}>

                        <div className="d-grid">

                            <Button 

                                variant="primary" 

                                size="sm" 

                                onClick={handleGenerate} 

                                disabled={isLoading}

                                style={{ backgroundColor: "#0B3D7B" }}

                            >

                                {isLoading ? <Spinner size="sm" animation="border"/> : <><FaFilter className="me-1"/> Generate</>}

                            </Button>

                        </div>

                    </Col>

                    <Col md={2} sm={6}>

                        <div className="d-grid">

                            <Button 

                                variant="danger" 

                                size="sm" 

                                onClick={exportPDF} 

                                disabled={!hasGenerated || reportData.length === 0}

                            >

                                <FaFilePdf className="me-1"/> Export PDF

                            </Button>

                        </div>

                    </Col>

                </Row>

            </Card.Body>

        </Card>



        {/* Data Table Section */}

        <Card className="shadow-sm border-0 mb-4">

          <Card.Body className="p-0">

            {hasGenerated ? (

                <div className="table-responsive" style={{ maxHeight: '75vh', overflowY: 'auto' }}>

                <Table bordered hover size="sm" className="text-center align-middle mb-0" style={{ fontSize: '0.85rem', minWidth: '1200px' }}>

                    <thead className="bg-light table-secondary sticky-top" style={{zIndex: 10}}>

                    <tr>

                        <th colSpan="2" className="bg-white border-bottom-0"></th>

                        <th colSpan="3" className="table-primary border-bottom text-primary">Fee/Academic (Tuition + Hostel)</th>

                        <th colSpan="3" className="table-info border-bottom text-info">Transport Fee</th>

                        <th colSpan="5" className="table-warning border-bottom text-dark">Summary</th>

                    </tr>

                    <tr>

                        <th style={{width: '60px'}}>Grade</th>

                        <th style={{width: '50px'}}>Sec</th>

                        

                        {/* Academic Columns */}

                        <th>Fixed</th>

                        <th>Paid</th>

                        <th>Bal</th>



                        {/* Transport Columns */}

                        <th>Fixed</th>

                        <th>Paid</th>

                        <th>Bal</th>



                        {/* Summary Columns */}

                        <th>Concess</th>

                        <th>Tot Fix</th>

                        <th>Act Paid</th>

                        <th>Tot Paid</th>

                        <th>Tot Bal</th>

                    </tr>

                    </thead>

                    <tbody>

                    {isLoading ? (

                        <tr>

                        <td colSpan="13" className="py-5 text-center">

                            <Spinner animation="border" variant="primary" />

                            <div className="mt-2 text-muted">Calculating Class-wise Balances...</div>

                        </td>

                        </tr>

                    ) : reportData.length === 0 ? (

                        <tr><td colSpan="13" className="text-center py-5 text-muted">No data available matching your filters</td></tr>

                    ) : (

                        <>

                        {reportData.map((row, idx) => (

                            <tr key={idx}>

                            <td className="fw-bold text-start ps-3">{row.standard}</td>

                            <td>{row.section}</td>

                            

                            <td className="text-end">{row.academicFixed?.toLocaleString()}</td>

                            <td className="text-end text-success">{row.academicPaid?.toLocaleString()}</td>

                            <td className="text-end text-danger">{row.academicBalance?.toLocaleString()}</td>



                            <td className="text-end">{row.transportFixed?.toLocaleString()}</td>

                            <td className="text-end text-success">{row.transportPaid?.toLocaleString()}</td>

                            <td className="text-end text-danger">{row.transportBalance?.toLocaleString()}</td>



                            <td className="text-end text-primary fw-bold">{row.concession?.toLocaleString()}</td>

                            <td className="text-end fw-bold">{row.totalFixed?.toLocaleString()}</td>

                            <td className="text-end fw-bold">{row.actualPaid?.toLocaleString()}</td>

                            <td className="text-end fw-bold">{row.totalPaid?.toLocaleString()}</td>

                            <td className="text-end fw-bold bg-light">{row.totalBalance?.toLocaleString()}</td>

                            </tr>

                        ))}

                        

                        <tr className="table-dark fw-bold sticky-bottom" style={{bottom: 0, zIndex: 10}}>

                            <td colSpan="2" className="text-end">Grand Total</td>

                            

                            <td className="text-end">{totals.acadFixed.toLocaleString()}</td>

                            <td className="text-end">{totals.acadPaid.toLocaleString()}</td>

                            <td className="text-end">{totals.acadBal.toLocaleString()}</td>



                            <td className="text-end">{totals.transFixed.toLocaleString()}</td>

                            <td className="text-end">{totals.transPaid.toLocaleString()}</td>

                            <td className="text-end">{totals.transBal.toLocaleString()}</td>



                            <td className="text-end">{totals.concession.toLocaleString()}</td>

                            <td className="text-end">{totals.totFixed.toLocaleString()}</td>

                            <td className="text-end">{totals.actPaid.toLocaleString()}</td>

                            <td className="text-end">{totals.totPaid.toLocaleString()}</td>

                            <td className="text-end">{totals.totBal.toLocaleString()}</td>

                        </tr>

                        </>

                    )}

                    </tbody>

                </Table>

                </div>

            ) : (

                <div className="text-center py-5 text-muted bg-light">

                    <FaFilter size={40} className="mb-3 text-secondary"/>

                    <h5>Ready to Generate</h5>

                    <p>Select your filters above and click <strong>Generate</strong> to view the Class Wise Balance Report.</p>

                </div>

            )}

          </Card.Body>

        </Card>

      </Container>

    </MainContentPage>

  )

}



export default BalanceList1