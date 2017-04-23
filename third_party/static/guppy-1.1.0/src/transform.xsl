<?xml version="1.0" encoding="ISO-8859-1"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="no" omit-xml-declaration="yes" />
  <xsl:param name="render" select="'yes'" />
  <xsl:param name="cursor">\\color{red}{\\cdot}</xsl:param>
  <xsl:param name="cblank">\\color{red}{[?]}</xsl:param>
  <xsl:param name="blank">\\color{blue}{[?]}</xsl:param>
  <xsl:param name="type">latex</xsl:param>

  <xsl:template match="r">
    <xsl:variable select="@ref" name="rr" />
    <xsl:variable select="count(../../b)" name="bs" />
    <xsl:apply-templates select="../../*[name()='c' and position()=$rr+$bs]" />
  </xsl:template>

  <xsl:template match="f">
    <xsl:apply-templates select="./b" />
  </xsl:template>

  <xsl:template match="b">
    <xsl:variable name="size"><xsl:if test="ancestor::c[@size='s'] and ../b[@p='small_latex']">small_</xsl:if></xsl:variable>
    <xsl:if test="@p=concat($size,$type)">
      <xsl:apply-templates select="@*|node()"/>
    </xsl:if>
  </xsl:template>

  <xsl:template match="b/text()">
    <xsl:copy-of select="."/>
  </xsl:template>

  <xsl:template match="e">
    <xsl:choose>
      <xsl:when test="$type='latex' and $render='yes'">
	<xsl:value-of select="@render" />
      </xsl:when>
      <xsl:otherwise>
	<xsl:copy-of select="./text()"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="/">
    <m>
      <xsl:apply-templates select="@*|node()"/>
    </m>
  </xsl:template>

  <xsl:template match="c">
    <xsl:choose>
      <!-- We need to add brackets if the following three conditions
	   are met:
	   - type is latex
	   - bracket is "yes"
	   - Any of:
	   == We have more than one child and not all of the following (to avoid bracketing things like the pi in pi^2 unless the cursor is around it):
	   ==== three children: 2 e and 1 f
	   ==== e's are empty
	   ==== f has one c with is_bracket="yes" OR (the f has c="yes" and the neighbouring es are not current or temp)
	   == We have one child and any of the following:
	   ==== it is not a variable and not a number
	   ==== it is current
	   ==== it is temp
      -->
      <xsl:when test="$type='latex' and @bracket = 'yes' and
      		      (
		        (
		          count(./*) != 1 and not
		          (
                            count(./e)=2 and
			    count(./f)=1 and 
			    count(./e[string-length(text())=0])=2 and
			    (
			      (
                                count(./f/c)=1 and
			        count(./f/c[@is_bracket='yes'])=1
			      )
			      or
			      (
			        f/@c='yes' and 
				count(./e[@current='yes'])=0 and
				count(./e[@temp='yes'])=0
			      )
			    )
			  )
			)  
			or
		        (
			  count(./*) = 1 and
			  string-length(./e/text()) != 1 and
			  number(./e/text()) != ./e/text()
			)  
			or
		        (
			  count(./*) = 1 and
			  ./e/@current = 'yes'
			)
			or
		        (
			  count(./*) = 1 and
			  ./e/@temp = 'yes'
			)
                      )
                      ">\left(<xsl:apply-templates select="@*|node()"/>\right)</xsl:when>
      <xsl:otherwise><xsl:apply-templates select="@*|node()"/></xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <xsl:template match="@*|node()">
    <xsl:apply-templates select="@*|node()"/>
  </xsl:template>
  
</xsl:stylesheet>
