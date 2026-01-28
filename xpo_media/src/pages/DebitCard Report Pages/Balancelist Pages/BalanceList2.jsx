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



const BalanceList2 = () => {

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

  

  const [totals, setTotals] = useState({

    acadFixed: 0, acadPaid: 0, acadBal: 0,

    transFixed: 0, transPaid: 0, transBal: 0,

    conc: 0,

    totFixed: 0, actPaid: 0, totPaid: 0, totBal: 0

  })



  // 1. Fetch Dropdown Data (No Default Report Load)

  useEffect(() => {

    if (schoolId && currentAcademicYear) {

        fetchSetupData()

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [schoolId, currentAcademicYear])



  const fetchSetupData = async () => {

    try {

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



  const handleFilterChange = (e) => {

    const { name, value } = e.target

    setFilters(prev => ({ ...prev, [name]: value }))

  }



  // 2. Generate and Filter Data

  const handleGenerate = async () => {

    if (!schoolId || !currentAcademicYear) return

    setIsLoading(true)

    setHasGenerated(true)



    try {

      // Build Query Params including feeHead

      let queryParams = `?schoolId=${schoolId}&academicYear=${currentAcademicYear}`

      if (filters.feeHead) queryParams += `&feeHead=${encodeURIComponent(filters.feeHead)}`



      const response = await fetch(

        `${ENDPOINTS.reports}/balance-list-2${queryParams}`,

        { headers: getAuthHeaders() }

      )



      if (response.ok) {

        let data = await response.json()

        

        // Client-Side Filtering logic for Standard/Section

        if (filters.standard) {

            data = data.filter(row => row.grade && row.grade.includes(filters.standard))

        }

        if (filters.section) {

            data = data.filter(row => {

                const parts = row.grade ? row.grade.split(' ') : []

                const sectionPart = parts[parts.length - 1]

                return sectionPart === filters.section

            })

        }

        

        setReportData(data)

        calculateGrandTotals(data)

        if(data.length === 0) toast.info("No records found for selected filters")

      } else {

        const errorText = await response.text()

        toast.error("Failed to fetch report: " + errorText)

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

      

      conc: acc.conc + (row.concession || 0),

      

      totFixed: acc.totFixed + (row.totalFixed || 0),

      actPaid: acc.actPaid + (row.actualPaid || 0),

      totPaid: acc.totPaid + (row.totalPaid || 0),

      totBal: acc.totBal + (row.totalBalance || 0),

    }), {

      acadFixed: 0, acadPaid: 0, acadBal: 0,

      transFixed: 0, transPaid: 0, transBal: 0,

      conc: 0, totFixed: 0, actPaid: 0, totPaid: 0, totBal: 0

    })

    setTotals(newTotals)

  }



  const exportPDF = () => {

    const doc = new jsPDF('landscape', 'mm', 'a3') 

    

    doc.setFontSize(14)

    doc.text("Detailed Balance List Report", 14, 15)

    doc.setFontSize(10)

    doc.text(`Academic Year: ${currentAcademicYear}`, 14, 22)

    

    let filterText = ""

    if(filters.standard) filterText += `Standard: ${filters.standard} `

    if(filters.section) filterText += `Section: ${filters.section} `

    if(filters.feeHead) filterText += `| Fee Head: ${filters.feeHead}`

    if(filterText) doc.text(filterText, 14, 28)



    const tableColumn = [

      "Sl.No", "Adm.No", "Student Name", "Father Name", "Grade", "Point",

      "Fee/Acad Fix", "Paid", "Bal", 

      "Transport Fix", "Paid", "Bal", 

      "Conc", "Narrat", 

      "Total Fixed", "Act Paid", "Tot Paid", "Tot Bal"

    ]



    const tableRows = reportData.map((row, index) => [

      index + 1,

      row.admissionNumber,

      row.studentName,

      row.fatherName,

      row.grade,

      row.boardingPoint,

      

      row.academicFixed?.toFixed(0),

      row.academicPaid?.toFixed(0),

      row.academicBalance?.toFixed(0),

      

      row.transportFixed?.toFixed(0),

      row.transportPaid?.toFixed(0),

      row.transportBalance?.toFixed(0),

      

      row.concession?.toFixed(0),

      row.narrative,

      

      row.totalFixed?.toFixed(0),

      row.actualPaid?.toFixed(0),

      row.totalPaid?.toFixed(0),

      row.totalBalance?.toFixed(0)

    ])



    tableRows.push([

      "", "", "GRAND TOTAL", "", "", "",

      totals.acadFixed.toFixed(0), totals.acadPaid.toFixed(0), totals.acadBal.toFixed(0),

      totals.transFixed.toFixed(0), totals.transPaid.toFixed(0), totals.transBal.toFixed(0),

      totals.conc.toFixed(0), "",

      totals.totFixed.toFixed(0), totals.actPaid.toFixed(0), totals.totPaid.toFixed(0), totals.totBal.toFixed(0)

    ])



    autoTable(doc, {

      head: [tableColumn],

      body: tableRows,

      startY: filterText ? 35 : 30,

      theme: 'grid',

      styles: { fontSize: 8, halign: 'center', cellPadding: 1, overflow: 'linebreak' },

      headStyles: { fillColor: [11, 61, 123], textColor: 255, fontSize: 8, fontStyle: 'bold' },

      columnStyles: {

        2: { halign: 'left', cellWidth: 35 }, 

        3: { halign: 'left', cellWidth: 30 }, 

        13: { halign: 'left', cellWidth: 30 }, 

      },

      didParseCell: function (data) {

        if (data.row.index === tableRows.length - 1) {

          data.cell.styles.fontStyle = 'bold';

          data.cell.styles.fillColor = [220, 220, 220];

        }

      }

    })



    doc.save("Detailed_Balance_List_2.pdf")

  }



  const fmt = (val) => val ? val.toLocaleString('en-IN', {maximumFractionDigits: 0}) : '0';



  return (

    <MainContentPage>

      <Container fluid className="px-3 py-3">

        <ToastContainer position="top-right" />

        

        {/* Header Section */}

        <div className="d-flex align-items-center mb-3">

            <Button 

                variant="link" 

                className="text-dark p-0 me-3 text-decoration-none" 

                onClick={() => navigate(-1)}

            >

                <FaArrowLeft size={18} /> Back

            </Button>

            <h4 className="mb-0 fw-bold text-primary">Detailed Balance List (Student Wise)</h4>

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

                <Table bordered hover size="sm" className="text-center align-middle small table-striped mb-0" style={{ fontSize: '0.75rem', minWidth: '1800px' }}>

                    <thead className="bg-light sticky-top" style={{zIndex: 10}}>

                    <tr>

                        <th colSpan="6" className="bg-white border-bottom-0">Student Information</th>

                        <th colSpan="3" className="table-primary border-bottom text-primary">Fee/Academic (Tuition + Hostel)</th>

                        <th colSpan="3" className="table-info border-bottom text-info">Transport Fee</th>

                        <th colSpan="2" className="bg-white border-bottom-0">Remarks</th>

                        <th colSpan="4" className="table-warning border-bottom text-dark">Grand Summary</th>

                    </tr>

                    <tr className="align-middle">

                        <th style={{width: '40px'}}>Sl.No</th>

                        <th style={{width: '80px'}}>Adm.No</th>

                        <th style={{width: '200px'}}>Stud Name</th>

                        <th style={{width: '150px'}}>FName</th>

                        <th style={{width: '60px'}}>Grade</th>

                        <th style={{width: '120px'}}>Point</th>

                        

                        {/* Academic */}

                        <th className="table-primary">Fixed</th>

                        <th className="table-primary">Paid</th>

                        <th className="table-primary">Bal</th>



                        {/* Transport */}

                        <th className="table-info">Fixed</th>

                        <th className="table-info">Paid</th>

                        <th className="table-info">Bal</th>



                        {/* Remarks */}

                        <th>Conc ess</th>

                        <th>Narrat</th>



                        {/* Summary */}

                        <th className="table-warning">Total Fixed</th>

                        <th className="table-warning">Act Paid</th>

                        <th className="table-warning">Tot Paid</th>

                        <th className="table-warning">Total Bal</th>

                    </tr>

                    </thead>

                    <tbody>

                    {isLoading ? (

                        <tr>

                        <td colSpan="18" className="py-5 text-center">

                            <Spinner animation="border" variant="primary" />

                            <div className="mt-2 text-muted">Generating Detailed Report...</div>

                        </td>

                        </tr>

                    ) : reportData.length === 0 ? (

                        <tr><td colSpan="18" className="text-center py-5 text-muted">No records found matching your filters</td></tr>

                    ) : (

                        <>

                        {reportData.map((row, idx) => (

                            <tr key={idx}>

                            <td>{idx + 1}</td>

                            <td>{row.admissionNumber}</td>

                            <td className="text-start fw-bold">{row.studentName}</td>

                            <td className="text-start">{row.fatherName}</td>

                            <td>{row.grade}</td>

                            <td className="text-start text-truncate" style={{maxWidth: '100px'}} title={row.boardingPoint}>{row.boardingPoint}</td>

                            

                            <td className="text-end table-primary-subtle">{fmt(row.academicFixed)}</td>

                            <td className="text-end text-success table-primary-subtle">{fmt(row.academicPaid)}</td>

                            <td className="text-end text-danger fw-bold table-primary-subtle">{fmt(row.academicBalance)}</td>



                            <td className="text-end table-info-subtle">{fmt(row.transportFixed)}</td>

                            <td className="text-end text-success table-info-subtle">{fmt(row.transportPaid)}</td>

                            <td className="text-end text-danger fw-bold table-info-subtle">{fmt(row.transportBalance)}</td>



                            <td className="text-end text-primary">{row.concession ? row.concession.toFixed(0) : '0'}</td>

                            <td className="text-start text-truncate" style={{maxWidth: '80px'}} title={row.narrative}>{row.narrative}</td>



                            <td className="text-end fw-bold table-warning-subtle">{fmt(row.totalFixed)}</td>

                            <td className="text-end table-warning-subtle">{fmt(row.actualPaid)}</td>

                            <td className="text-end fw-bold table-warning-subtle">{fmt(row.totalPaid)}</td>

                            <td className="text-end fw-bold bg-danger text-white">{fmt(row.totalBalance)}</td>

                            </tr>

                        ))}

                        

                        <tr className="table-dark fw-bold sticky-bottom" style={{bottom: 0, zIndex: 10}}>

                            <td colSpan="6" className="text-end">GRAND TOTAL</td>

                            

                            <td className="text-end">{fmt(totals.acadFixed)}</td>

                            <td className="text-end">{fmt(totals.acadPaid)}</td>

                            <td className="text-end">{fmt(totals.acadBal)}</td>



                            <td className="text-end">{fmt(totals.transFixed)}</td>

                            <td className="text-end">{fmt(totals.transPaid)}</td>

                            <td className="text-end">{fmt(totals.transBal)}</td>



                            <td className="text-end">{fmt(totals.conc)}</td>

                            <td></td>



                            <td className="text-end">{fmt(totals.totFixed)}</td>

                            <td className="text-end">{fmt(totals.actPaid)}</td>

                            <td className="text-end">{fmt(totals.totPaid)}</td>

                            <td className="text-end">{fmt(totals.totBal)}</td>

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

                    <p>Select your filters above and click <strong>Generate</strong> to view the Detailed Balance List.</p>

                </div>

            )}

          </Card.Body>

        </Card>

      </Container>

    </MainContentPage>

  )

}



export default BalanceList2